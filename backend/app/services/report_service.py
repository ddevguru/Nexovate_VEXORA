import os
import datetime
from typing import List, Dict, Any
from reportlab.lib import colors
from reportlab.lib.pagesizes import letter
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak, HRFlowable
)
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from app.models.all_models import Investigation, EvidenceFile, Event, Incident, Anomaly
from app.core.config import settings
from app.core.logging import logger

class ReportService:
    @staticmethod
    def generate_pdf_report(
        investigation: Investigation,
        evidence_files: List[EvidenceFile],
        events: List[Event],
        incident: Incident,
        anomalies: List[Anomaly],
        ai_summary: Dict[str, Any]
    ) -> str:
        """Generates a professional forensic PDF report for the investigation."""
        
        reports_dir = os.path.join(settings.UPLOAD_DIR, "reports")
        os.makedirs(reports_dir, exist_ok=True)
        filename = f"Report_{investigation.id[:8]}_{datetime.datetime.utcnow().strftime('%Y%m%d_%H%M%S')}.pdf"
        filepath = os.path.join(reports_dir, filename)

        doc = SimpleDocTemplate(
            filepath,
            pagesize=letter,
            rightMargin=36,
            leftMargin=36,
            topMargin=36,
            bottomMargin=36
        )

        styles = getSampleStyleSheet()

        title_style = ParagraphStyle(
            'DocTitle',
            parent=styles['Heading1'],
            fontName='Helvetica-Bold',
            fontSize=22,
            leading=26,
            textColor=colors.HexColor("#0f172a")
        )
        subtitle_style = ParagraphStyle(
            'DocSubtitle',
            parent=styles['Normal'],
            fontName='Helvetica',
            fontSize=11,
            leading=14,
            textColor=colors.HexColor("#475569")
        )
        heading_style = ParagraphStyle(
            'SectionHeading',
            parent=styles['Heading2'],
            fontName='Helvetica-Bold',
            fontSize=14,
            leading=18,
            textColor=colors.HexColor("#0284c7"),
            spaceBefore=14,
            spaceAfter=6
        )
        body_style = ParagraphStyle(
            'BodyDark',
            parent=styles['Normal'],
            fontName='Helvetica',
            fontSize=9,
            leading=12,
            textColor=colors.HexColor("#1e293b")
        )
        disclaimer_style = ParagraphStyle(
            'Disclaimer',
            parent=styles['Normal'],
            fontName='Helvetica-Oblique',
            fontSize=8,
            leading=10,
            textColor=colors.HexColor("#64748b")
        )

        story = []

        # Title & Header
        story.append(Paragraph("CYBERTRACE AI — DIGITAL FORENSIC INCIDENT REPORT", title_style))
        story.append(Paragraph(f"Generated: {datetime.datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S UTC')} | Investigation ID: {investigation.id}", subtitle_style))
        story.append(Spacer(1, 10))
        story.append(HRFlowable(width="100%", thickness=1.5, color=colors.HexColor("#0284c7"), spaceAfter=15))

        # 1. Investigation Metadata Table
        story.append(Paragraph("1. Investigation Overview", heading_style))
        meta_data = [
            [Paragraph("<b>Investigation Name:</b>", body_style), Paragraph(investigation.name, body_style), Paragraph("<b>Severity:</b>", body_style), Paragraph(investigation.severity, body_style)],
            [Paragraph("<b>Status:</b>", body_style), Paragraph(investigation.status, body_style), Paragraph("<b>Total Events:</b>", body_style), Paragraph(str(len(events)), body_style)],
            [Paragraph("<b>Evidence Files:</b>", body_style), Paragraph(str(len(evidence_files)), body_style), Paragraph("<b>Anomalies:</b>", body_style), Paragraph(str(len(anomalies)), body_style)]
        ]
        meta_table = Table(meta_data, colWidths=[130, 140, 110, 140])
        meta_table.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,-1), colors.HexColor("#f8fafc")),
            ('BOX', (0,0), (-1,-1), 0.5, colors.HexColor("#cbd5e1")),
            ('INNERGRID', (0,0), (-1,-1), 0.5, colors.HexColor("#e2e8f0")),
            ('PADDING', (0,0), (-1,-1), 5),
        ]))
        story.append(meta_table)
        story.append(Spacer(1, 12))

        # 2. Executive Summary & AI Findings
        story.append(Paragraph("2. Executive Summary", heading_style))
        exec_summary_text = ai_summary.get("executive_summary", "Automated correlation completed across evidence logs.")
        story.append(Paragraph(exec_summary_text, body_style))
        story.append(Spacer(1, 10))

        # 3. Evidence Inventory & SHA-256 Hashes
        story.append(Paragraph("3. Digital Evidence Inventory & Integrity Hashes", heading_style))
        ev_header = [Paragraph("<b>Filename</b>", body_style), Paragraph("<b>Type</b>", body_style), Paragraph("<b>Size (bytes)</b>", body_style), Paragraph("<b>SHA-256 Checksum</b>", body_style)]
        ev_rows = [ev_header]
        for ef in evidence_files:
            ev_rows.append([
                Paragraph(ef.filename, body_style),
                Paragraph(ef.file_type, body_style),
                Paragraph(str(ef.file_size), body_style),
                Paragraph(f"<font size=7>{ef.sha256_hash}</font>", body_style)
            ])
        ev_table = Table(ev_rows, colWidths=[120, 50, 70, 280])
        ev_table.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,0), colors.HexColor("#e2e8f0")),
            ('BOX', (0,0), (-1,-1), 0.5, colors.HexColor("#cbd5e1")),
            ('INNERGRID', (0,0), (-1,-1), 0.5, colors.HexColor("#e2e8f0")),
            ('PADDING', (0,0), (-1,-1), 4),
        ]))
        story.append(ev_table)
        story.append(Spacer(1, 12))

        # 4. Attack Chain Stages
        story.append(Paragraph("4. Reconstructed Attack Chain", heading_style))
        stages = ai_summary.get("attack_stages", [])
        if stages:
            stg_rows = [[Paragraph("<b>Stage</b>", body_style), Paragraph("<b>Confidence</b>", body_style), Paragraph("<b>Description & Evidence</b>", body_style)]]
            for stg in stages:
                stg_rows.append([
                    Paragraph(stg.get("title", stg.get("stage")), body_style),
                    Paragraph(f"{stg.get('confidence', 85)}%", body_style),
                    Paragraph(stg.get("description", ""), body_style)
                ])
            stg_table = Table(stg_rows, colWidths=[150, 70, 300])
            stg_table.setStyle(TableStyle([
                ('BACKGROUND', (0,0), (-1,0), colors.HexColor("#f1f5f9")),
                ('BOX', (0,0), (-1,-1), 0.5, colors.HexColor("#cbd5e1")),
                ('INNERGRID', (0,0), (-1,-1), 0.5, colors.HexColor("#e2e8f0")),
                ('PADDING', (0,0), (-1,-1), 4),
            ]))
            story.append(stg_table)
        story.append(Spacer(1, 12))

        # 5. Key Incident Timeline (Top events)
        story.append(Paragraph("5. Key Chronological Timeline", heading_style))
        timeline_header = [Paragraph("<b>Timestamp (UTC)</b>", body_style), Paragraph("<b>User</b>", body_style), Paragraph("<b>Source IP</b>", body_style), Paragraph("<b>Action</b>", body_style), Paragraph("<b>Severity</b>", body_style), Paragraph("<b>Risk</b>", body_style)]
        timeline_rows = [timeline_header]
        
        def format_timestamp(ts):
            if hasattr(ts, 'strftime'):
                return ts.strftime("%Y-%m-%d %H:%M:%S")
            return str(ts) if ts else "-"

        top_events = sorted(events, key=lambda e: str(e.timestamp))[:15] # top 15 timeline events
        for e in top_events:
            sev = e.severity or "LOW"
            sev_color = "#ef4444" if sev in ["HIGH", "CRITICAL"] else ("#f59e0b" if sev == "MEDIUM" else "#10b981")
            timeline_rows.append([
                Paragraph(format_timestamp(e.timestamp), body_style),
                Paragraph(e.user or "-", body_style),
                Paragraph(e.source_ip or "-", body_style),
                Paragraph(e.action or "ACTIVITY", body_style),
                Paragraph(f"<font color='{sev_color}'><b>{sev}</b></font>", body_style),
                Paragraph(str(e.risk_score or 0), body_style)
            ])
        timeline_table = Table(timeline_rows, colWidths=[100, 70, 80, 140, 70, 60])
        timeline_table.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,0), colors.HexColor("#e2e8f0")),
            ('BOX', (0,0), (-1,-1), 0.5, colors.HexColor("#cbd5e1")),
            ('INNERGRID', (0,0), (-1,-1), 0.5, colors.HexColor("#e2e8f0")),
            ('PADDING', (0,0), (-1,-1), 4),
        ]))
        story.append(timeline_table)
        story.append(Spacer(1, 14))

        # 6. Recommendations & Disclaimer
        story.append(Paragraph("6. Investigative Recommendations", heading_style))
        recs = ai_summary.get("recommended_steps", []) if isinstance(ai_summary, dict) else []
        if not recs:
            recs = [
                "Isolate affected hosts and invalidate active user sessions.",
                "Review firewall rules and block suspicious external IPs.",
                "Perform full endpoint anti-malware and file integrity scan."
            ]
        for r in recs:
            story.append(Paragraph(f"• {r}", body_style))
            story.append(Spacer(1, 2))

        story.append(Spacer(1, 20))
        story.append(HRFlowable(width="100%", thickness=0.5, color=colors.HexColor("#cbd5e1"), spaceAfter=8))
        story.append(Paragraph(
            "<b>Disclaimer:</b> This report is an analytical investigation aid generated automatically by CYBERTRACE AI based on digital event logs. "
            "It does not by itself establish legal attribution or malicious intent without independent forensic verification.",
            disclaimer_style
        ))

        doc.build(story)
        logger.info(f"Generated PDF report at {filepath}")
        return filepath
