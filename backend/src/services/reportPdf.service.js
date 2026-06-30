const PDFDocument = require('pdfkit');

function fmtSeconds(sec) {
  const s = Math.max(0, Math.round(sec || 0));
  const h = String(Math.floor(s / 3600)).padStart(2, '0');
  const m = String(Math.floor((s % 3600) / 60)).padStart(2, '0');
  const ss = String(s % 60).padStart(2, '0');
  return `${h}:${m}:${ss}`;
}

function fmtDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' });
}

/**
 * Streams a User Activity Report PDF into the supplied writable stream (res).
 * Uses pdfkit (pure JS, no native deps).
 */
function buildUserActivityPdf(stream, { user, activity, from, to }) {
  const doc = new PDFDocument({ size: 'A4', margin: 50 });
  doc.pipe(stream);

  // Header
  doc.fontSize(20).fillColor('#111827').text('User Activity Report', { align: 'left' });
  doc.moveDown(0.3);
  doc.fontSize(11).fillColor('#374151');
  doc.text(`Name: ${user.name}`);
  doc.text(`Email: ${user.email}`);
  doc.text(`Department: ${user.service?.name || 'N/A'}   |   Role: ${user.role}`);
  const rangeLabel = from || to
    ? `${from ? fmtDate(from) : 'Start'}  to  ${to ? fmtDate(to) : 'Now'}`
    : 'All time (no filter applied)';
  doc.text(`Date range: ${rangeLabel}`);
  doc.text(`Generated: ${fmtDate(new Date())}`);
  doc.moveDown(0.8);

  // Summary
  const t = activity.totals;
  doc.fontSize(14).fillColor('#111827').text('Summary');
  doc.moveDown(0.2);
  doc.fontSize(11).fillColor('#374151');
  doc.text(`Total time worked: ${t.totalHours} hrs (${fmtSeconds(t.totalSeconds)})`);
  doc.text(`Tasks worked on: ${t.taskCount}`);
  doc.text(`Tasks completed: ${t.completedCount}`);
  doc.text(`Pause actions: ${t.pauseCount}    |    Resume actions: ${t.resumeCount}`);
  doc.moveDown(0.8);

  // Per-task breakdown
  doc.fontSize(14).fillColor('#111827').text('Time taken per task');
  doc.moveDown(0.3);
  doc.fontSize(10).fillColor('#374151');
  if (!activity.tasks.length) {
    doc.text('No task activity in this period.');
  } else {
    activity.tasks.forEach((task) => {
      doc.font('Helvetica-Bold').text(task.title, { continued: false });
      doc.font('Helvetica').text(
        `Status: ${task.status}   Time: ${task.totalHours} hrs (${fmtSeconds(task.totalSeconds)})   ` +
        `Pauses: ${task.pauseCount}   Resumes: ${task.resumeCount}`
      );
      doc.moveDown(0.4);
    });
  }
  doc.moveDown(0.5);

  // Detailed activity timeline
  doc.fontSize(14).fillColor('#111827').text('Detailed activity timestamps');
  doc.moveDown(0.3);
  doc.fontSize(9).fillColor('#374151');
  if (!activity.sessions.length) {
    doc.text('No sessions recorded in this period.');
  } else {
    activity.sessions.forEach((sn, i) => {
      doc.font('Helvetica-Bold').text(
        `${i + 1}. ${sn.taskTitle}  —  ${fmtSeconds(sn.durationSeconds)}`
      );
      doc.font('Helvetica').text(
        `   Start: ${fmtDate(sn.startTime)}   End: ${fmtDate(sn.endTime)}   (${sn.status})`
      );
      sn.pauseEvents.forEach((e) => {
        doc.text(`   • ${e.type.toUpperCase()} at ${fmtDate(e.at)}`);
      });
      doc.moveDown(0.3);
      if (doc.y > 760) doc.addPage();
    });
  }

  doc.end();
}

module.exports = { buildUserActivityPdf };
