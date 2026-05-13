import { Router } from 'express';
import Anthropic from '@anthropic-ai/sdk';
import PDFDocument from 'pdfkit';
import { createClient } from '@supabase/supabase-js';

const router = Router();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
);

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// ── POST /api/report/generate ───────────────────────────────────

router.post('/generate', async (req, res) => {
  const { jobId } = req.body;
  if (!jobId) return res.status(400).json({ error: 'jobId is required' });

  try {
    // Fetch all job data in parallel
    const [
      { data: job, error: jobErr },
      { data: rooms, error: roomErr },
      { data: readings, error: readErr },
      { data: equipment, error: equipErr },
      { data: media, error: mediaErr },
    ] = await Promise.all([
      supabase.from('jobs').select('*').eq('id', jobId).single(),
      supabase.from('rooms').select('*').eq('job_id', jobId).order('created_at'),
      supabase.from('moisture_readings').select('*, room:rooms(name)').eq('job_id', jobId).order('reading_date'),
      supabase.from('equipment_log').select('*, room:rooms(name)').eq('job_id', jobId).order('placed_date'),
      supabase.from('media').select('id, type, room_id, caption, room:rooms(name)').eq('job_id', jobId),
    ]);

    if (jobErr) throw jobErr;
    if (roomErr) throw roomErr;

    // Build photo counts per room
    const photoCounts = {};
    let totalPhotos = 0;
    for (const m of (media || [])) {
      if (m.type === 'photo' || m.type === 'video') {
        totalPhotos++;
        const rName = m.room?.name || 'Unassigned';
        photoCounts[rName] = (photoCounts[rName] || 0) + 1;
      }
    }

    // Build structured context for Claude
    const context = {
      job: {
        title: job.title,
        address: job.address,
        loss_type: job.loss_type,
        status: job.status,
        claim_number: job.claim_number,
        insurance_company: job.insurance_company,
        adjuster_name: job.adjuster_name,
        adjuster_phone: job.adjuster_phone,
        notes: job.notes,
        created_at: job.created_at,
        updated_at: job.updated_at,
      },
      rooms: (rooms || []).map((r) => ({
        name: r.name,
        floor_level: r.floor_level,
        sqft: r.sqft,
        affected: r.affected,
      })),
      moisture_readings: (readings || []).map((r) => ({
        room: r.room?.name,
        date: r.reading_date,
        location: r.location_label,
        material: r.material,
        value: r.reading_value,
        type: r.reading_type,
        goal_met: r.is_goal_met,
      })),
      equipment: (equipment || []).map((e) => ({
        type: e.equipment_type,
        brand_model: e.brand_model,
        quantity: e.quantity,
        room: e.room?.name,
        placed: e.placed_date,
        removed: e.removed_date,
        serial_numbers: e.serial_numbers,
      })),
      photo_counts: photoCounts,
      total_photos: totalPhotos,
    };

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4000,
      system: `You are an expert property restoration documentation specialist. Generate a professional, carrier-ready damage assessment report. Be specific, factual, and use industry standard terminology (IICRC S500/S520 standards where applicable). Structure your report clearly.

Return your response as valid JSON with this exact structure:
{
  "summary": "2-3 sentence executive summary",
  "loss_description": "Detailed description of the loss event and scope of damage",
  "rooms": [{"name": "room name", "narrative": "room-specific damage assessment and mitigation narrative"}],
  "mitigation": "Water mitigation narrative covering drying progress, equipment justification, and methodology",
  "status": "Current status assessment",
  "next_steps": "Recommended next steps and timeline"
}

Do not include markdown formatting, code fences, or any text outside the JSON object.`,
      messages: [
        {
          role: 'user',
          content: `Generate a professional restoration damage assessment report based on this job data:\n\n${JSON.stringify(context, null, 2)}`,
        },
      ],
    });

    const text = message.content[0].text;
    let report;
    try {
      report = JSON.parse(text);
    } catch {
      // Try extracting JSON from the response
      const match = text.match(/\{[\s\S]*\}/);
      report = match ? JSON.parse(match[0]) : { summary: text, loss_description: '', rooms: [], mitigation: '', status: '', next_steps: '' };
    }

    res.json({
      report,
      context: {
        job: context.job,
        rooms: context.rooms,
        moisture_readings: context.moisture_readings,
        equipment: context.equipment,
        photo_counts: context.photo_counts,
        total_photos: context.total_photos,
      },
    });
  } catch (err) {
    console.error('Report generation error:', err);
    res.status(500).json({ error: err.message || 'Failed to generate report' });
  }
});

// ── POST /api/report/pdf ────────────────────────────────────────

router.post('/pdf', async (req, res) => {
  const { report, context } = req.body;
  if (!report || !context) return res.status(400).json({ error: 'report and context are required' });

  try {
    const doc = new PDFDocument({
      size: 'LETTER',
      margins: { top: 60, bottom: 60, left: 60, right: 60 },
      info: {
        Title: `Restoration Report - ${context.job.address}`,
        Author: 'RestoDoc',
      },
    });

    const chunks = [];
    doc.on('data', (chunk) => chunks.push(chunk));

    const pdfReady = new Promise((resolve) => doc.on('end', resolve));

    const pageWidth = 612 - 120; // LETTER width minus margins

    // ── Helper functions ──
    function sectionTitle(text) {
      doc.moveDown(0.8);
      doc.font('Helvetica-Bold').fontSize(13).fillColor('#1e293b').text(text);
      doc.moveDown(0.15);
      doc.moveTo(doc.x, doc.y).lineTo(doc.x + pageWidth, doc.y).strokeColor('#cbd5e1').lineWidth(0.5).stroke();
      doc.moveDown(0.4);
    }

    function bodyText(text) {
      doc.font('Helvetica').fontSize(10).fillColor('#334155').text(text || 'N/A', { lineGap: 3 });
    }

    function labelValue(label, value) {
      doc.font('Helvetica-Bold').fontSize(9).fillColor('#64748b').text(label, { continued: true });
      doc.font('Helvetica').fontSize(10).fillColor('#1e293b').text(`  ${value || 'N/A'}`);
    }

    // ── Header ──
    doc.font('Helvetica-Bold').fontSize(22).fillColor('#0f172a').text('Restoration Report', { align: 'center' });
    doc.moveDown(0.3);
    doc.font('Helvetica').fontSize(10).fillColor('#64748b').text('Property Damage Assessment & Mitigation Documentation', { align: 'center' });
    doc.moveDown(0.5);
    doc.moveTo(60, doc.y).lineTo(60 + pageWidth, doc.y).strokeColor('#3b82f6').lineWidth(2).stroke();
    doc.moveDown(0.8);

    // ── Job info ──
    labelValue('Property:', context.job.address);
    labelValue('Loss Type:', context.job.loss_type?.charAt(0).toUpperCase() + context.job.loss_type?.slice(1));
    labelValue('Status:', context.job.status?.charAt(0).toUpperCase() + context.job.status?.slice(1));
    if (context.job.claim_number) labelValue('Claim #:', context.job.claim_number);
    if (context.job.insurance_company) labelValue('Insurance:', context.job.insurance_company);
    if (context.job.adjuster_name) labelValue('Adjuster:', `${context.job.adjuster_name}${context.job.adjuster_phone ? ' — ' + context.job.adjuster_phone : ''}`);
    labelValue('Date of Loss:', new Date(context.job.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }));
    labelValue('Report Date:', new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }));
    labelValue('Photos Documented:', String(context.total_photos));

    // ── Executive summary ──
    sectionTitle('Executive Summary');
    bodyText(report.summary);

    // ── Loss description ──
    sectionTitle('Loss Description & Scope');
    bodyText(report.loss_description);

    // ── Room assessments ──
    sectionTitle('Room-by-Room Assessment');
    if (report.rooms && report.rooms.length > 0) {
      for (const room of report.rooms) {
        doc.moveDown(0.3);
        doc.font('Helvetica-Bold').fontSize(11).fillColor('#1e293b').text(room.name);

        // Find room metadata
        const meta = context.rooms?.find((r) => r.name === room.name);
        if (meta) {
          const details = [meta.floor_level, meta.sqft ? `${meta.sqft} sqft` : null, meta.affected ? 'Affected' : 'Unaffected'].filter(Boolean).join(' • ');
          doc.font('Helvetica').fontSize(8).fillColor('#94a3b8').text(details);
        }

        const photoCount = context.photo_counts?.[room.name];
        if (photoCount) {
          doc.font('Helvetica').fontSize(8).fillColor('#3b82f6').text(`${photoCount} photo(s) documented`);
        }

        doc.moveDown(0.15);
        bodyText(room.narrative);
      }
    }

    // ── Moisture readings table ──
    if (context.moisture_readings && context.moisture_readings.length > 0) {
      sectionTitle('Moisture Readings');

      // Table header
      const colW = [90, 90, 70, 70, 60, 50];
      const headers = ['Room', 'Location', 'Material', 'Date', 'Value', 'Goal'];
      doc.font('Helvetica-Bold').fontSize(8).fillColor('#64748b');
      let tableX = 60;
      headers.forEach((h, i) => {
        doc.text(h, tableX, doc.y, { width: colW[i], continued: i < headers.length - 1 });
        tableX += colW[i];
      });
      doc.moveDown(0.3);

      // Rows (limit to latest 30)
      const rows = context.moisture_readings.slice(-30);
      doc.font('Helvetica').fontSize(8).fillColor('#334155');
      for (const r of rows) {
        if (doc.y > 680) { doc.addPage(); }
        tableX = 60;
        const vals = [r.room || '', r.location, r.material, r.date, `${r.value}${r.type === 'moisture' ? '%' : ''}`, r.goal_met ? 'Yes' : 'No'];
        vals.forEach((v, i) => {
          doc.text(String(v), tableX, doc.y, { width: colW[i], continued: i < vals.length - 1 });
          tableX += colW[i];
        });
        doc.moveDown(0.15);
      }
    }

    // ── Equipment log ──
    if (context.equipment && context.equipment.length > 0) {
      sectionTitle('Equipment Log');
      for (const e of context.equipment) {
        const type = e.type.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
        const details = [
          type,
          e.brand_model,
          `Qty: ${e.quantity}`,
          e.room ? `Room: ${e.room}` : null,
          `Placed: ${e.placed}`,
          e.removed ? `Removed: ${e.removed}` : 'Still on site',
          e.serial_numbers ? `SN: ${e.serial_numbers}` : null,
        ].filter(Boolean).join(' • ');

        if (doc.y > 700) { doc.addPage(); }
        doc.font('Helvetica').fontSize(9).fillColor('#334155').text(details);
        doc.moveDown(0.15);
      }
    }

    // ── Mitigation narrative ──
    sectionTitle('Water Mitigation Narrative');
    bodyText(report.mitigation);

    // ── Status ──
    sectionTitle('Current Status');
    bodyText(report.status);

    // ── Next steps ──
    sectionTitle('Recommended Next Steps');
    bodyText(report.next_steps);

    // ── Footer ──
    doc.moveDown(1.5);
    doc.moveTo(60, doc.y).lineTo(60 + pageWidth, doc.y).strokeColor('#e2e8f0').lineWidth(0.5).stroke();
    doc.moveDown(0.4);
    doc.font('Helvetica').fontSize(8).fillColor('#94a3b8').text(
      `Generated by RestoDoc on ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}`,
      { align: 'center' },
    );

    doc.end();
    await pdfReady;

    const pdfBuffer = Buffer.concat(chunks);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${context.job.address.replace(/[^a-zA-Z0-9]/g, '_')}-${new Date().toISOString().split('T')[0]}.pdf"`);
    res.send(pdfBuffer);
  } catch (err) {
    console.error('PDF generation error:', err);
    res.status(500).json({ error: err.message || 'Failed to generate PDF' });
  }
});

export default router;
