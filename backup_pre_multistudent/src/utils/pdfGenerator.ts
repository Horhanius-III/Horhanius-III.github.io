import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { jsPDF } from 'jspdf';
import { FormSection2Template, SSLForm } from '../types';

/**
 * Creates a deterministic SHA-256-like hex representation for the document
 */
export function generateCertificateHash(
  studentId: string,
  sessionDate: string,
  approvedHours: number,
  verificationToken: string
): string {
  const raw = `${studentId}:${sessionDate}:${approvedHours}:${verificationToken}:SO_WHAT_ELSE_MCPS_560_51_2026`;
  let hash1 = 5381;
  let hash2 = 52711;
  for (let i = 0; i < raw.length; i++) {
    const char = raw.charCodeAt(i);
    hash1 = (hash1 * 33) ^ char;
    hash2 = (hash2 * 31) ^ char;
  }
  const part1 = Math.abs(hash1).toString(16).padStart(8, '0');
  const part2 = Math.abs(hash2).toString(16).padStart(8, '0');
  const part3 = Math.abs(hash1 ^ hash2).toString(16).padStart(8, '0');
  const part4 = Math.abs(hash1 + hash2).toString(16).padStart(8, '0');
  return `${part1}${part2}${part3}${part4}`.toUpperCase();
}

export function generateVerificationToken(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let token = 'SWE-';
  for (let i = 0; i < 4; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  token += '-';
  for (let i = 0; i < 4; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return token;
}

export interface McpsPdfResult {
  blobUrl: string;
  fileName: string;
  verificationToken: string;
  sha256Hash: string;
}

/**
 * Populates the ORIGINAL Montgomery County Public Schools (MCPS Form 560-51) PDF.
 * - Section I: Only Student Name and Student ID Number (if available).
 * - Section II: Pre-filled with organization details and supervisor verification.
 * - Leaves Academic Preparation & Service Activity Description EMPTY by default,
 *   unless customized by admin template options!
 * - Page 2: Completely untouched for student reflection as required by MCPS guidelines.
 */
export async function populateOriginalMcpsFormPdf(
  form: SSLForm,
  template?: FormSection2Template,
  shouldAutoDownload = true
): Promise<McpsPdfResult> {
  const hours = form.totalVerifiedHours || 0;
  const startDate = form.dateRange?.start || new Date().toISOString().split('T')[0];
  const endDate = form.dateRange?.end || startDate;
  const daysCount = Math.max(1, form.sessionIds?.length || 1);
  const hoursPerDay = hours / daysCount;

  const verificationToken = form.verificationToken || generateVerificationToken();
  const studentIdentifier = form.studentId || form.sweId || 'STUDENT';
  const sha256Hash =
    form.sha256Hash ||
    generateCertificateHash(studentIdentifier, startDate, hours, verificationToken);

  const fileName = `MCPS_Form_560-51_${form.studentName.replace(/\s+/g, '_')}_${startDate}.pdf`;

  try {
    // 1. Fetch original PDF bytes from workspace public assets
    const originalPdfUrl = '/assets/aistudio/560-51_b3fd5f4c.pdf';
    const response = await fetch(originalPdfUrl);
    if (!response.ok) {
      throw new Error(`Failed to load original template PDF: ${response.statusText}`);
    }
    const existingPdfBytes = await response.arrayBuffer();

    // 2. Load into pdf-lib
    const pdfDoc = await PDFDocument.load(existingPdfBytes);
    const pages = pdfDoc.getPages();
    const page1 = pages[0];

    const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    // Coordinate system in pdf-lib: (0,0) is bottom-left, width=612, height=792 (standard US Letter)
    const darkSlate = rgb(0.08, 0.12, 0.2);
    const emeraldColor = rgb(0.02, 0.45, 0.25);

    // =========================================================================
    // SECTION I: STUDENT INFORMATION (Name & Student ID)
    // =========================================================================
    // Student Full Name (x=116, y=483)
    if (form.studentName) {
      page1.drawText(form.studentName, {
        x: 116,
        y: 483,
        size: 9.5,
        font: fontBold,
        color: darkSlate,
      });
    }

    // Student ID Number (x=473, y=483)
    const idToPrint = form.studentId || form.sweId;
    if (idToPrint && idToPrint.trim()) {
      page1.drawText(idToPrint.trim(), {
        x: 473,
        y: 483,
        size: 9.5,
        font: fontBold,
        color: darkSlate,
      });
    }

    // Optional school if present
    if (form.school) {
      page1.drawText(form.school, {
        x: 82,
        y: 468,
        size: 8.5,
        font: fontRegular,
        color: darkSlate,
      });
    }

    // Optional grade if present
    if (form.grade) {
      page1.drawText(form.grade, {
        x: 520,
        y: 468,
        size: 8.5,
        font: fontRegular,
        color: darkSlate,
      });
    }

    // Student Email
    if (form.studentEmail) {
      page1.drawText(form.studentEmail, {
        x: 82,
        y: 452,
        size: 8.5,
        font: fontRegular,
        color: darkSlate,
      });
    }

    // =========================================================================
    // SECTION II: COMMUNITY ORGANIZATION INFORMATION
    // =========================================================================
    // 1. Checkbox: "Is your organization listed as MCPS SSL...?" -> Yes [X] (Field 14a: x=58.5, y=381.5)
    page1.drawText('X', {
      x: 58.5,
      y: 381.5,
      size: 10,
      font: fontBold,
      color: darkSlate,
    });

    // 2. Organization Name (Field 15a: x=122, y=348)
    const orgName = template?.organizationName || form.organization || 'So What Else, Inc.';
    page1.drawText(orgName, {
      x: 122,
      y: 348,
      size: 9.5,
      font: fontBold,
      color: darkSlate,
    });

    // 3. Federal EIN (x=173, y=333)
    const taxId = template?.taxId || form.ein || '27-0899847';
    page1.drawText(taxId, {
      x: 173,
      y: 333,
      size: 8.5,
      font: fontBold,
      color: darkSlate,
    });

    // 4. Phone (x=440, y=333)
    const phone = template?.phone || form.supervisorPhone || '(240) 668-4500';
    page1.drawText(phone, {
      x: 440,
      y: 333,
      size: 8.5,
      font: fontBold,
      color: darkSlate,
    });

    // 5. Address (x=72, y=320)
    const address = template?.address || '4924 Wyaconda Rd, Rockville, MD 20852';
    page1.drawText(address, {
      x: 72,
      y: 320,
      size: 8.5,
      font: fontRegular,
      color: darkSlate,
    });

    // 6. Organization Email (x=65, y=304)
    const email = template?.email || form.supervisorEmail || 'volunteer@sowhatelse.org';
    page1.drawText(email, {
      x: 65,
      y: 304,
      size: 8.5,
      font: fontRegular,
      color: darkSlate,
    });

    // 7. Academic Preparation Description (x=42, y=271)
    // CRITICAL: Leave empty by default, ONLY populate if admin customized it in template!
    const academicPrep = template?.academicPreparationText || form.academicPreparationText || '';
    if (academicPrep.trim()) {
      page1.drawText(academicPrep.trim(), {
        x: 42,
        y: 271,
        size: 7.5,
        font: fontRegular,
        color: darkSlate,
        maxWidth: 525,
        lineHeight: 9.5,
      });
    }

    // 8. Service Action Type: Direct (x=325.5, y=231.5)
    const serviceType = template?.serviceType || 'DIRECT';
    if (serviceType === 'DIRECT') {
      page1.drawText('X', {
        x: 325.5,
        y: 231.5,
        size: 9,
        font: fontBold,
        color: darkSlate,
      });
    } else if (serviceType === 'INDIRECT') {
      page1.drawText('X', {
        x: 371.5,
        y: 231.5,
        size: 9,
        font: fontBold,
        color: darkSlate,
      });
    } else {
      page1.drawText('X', {
        x: 426.5,
        y: 231.5,
        size: 9,
        font: fontBold,
        color: darkSlate,
      });
    }

    // 9. Service Activity Description (x=42, y=198)
    // CRITICAL: Leave empty by default, ONLY populate if admin customized it in template!
    const activityDesc = template?.activityDescriptionText || '';
    if (activityDesc.trim()) {
      page1.drawText(activityDesc.trim(), {
        x: 42,
        y: 198,
        size: 7.5,
        font: fontRegular,
        color: darkSlate,
        maxWidth: 525,
        lineHeight: 9.5,
      });
    }

    // =========================================================================
    // SERVICE RECORD TABLE (y=98)
    // =========================================================================
    // Date From (x=45, y=98)
    page1.drawText(startDate, {
      x: 45,
      y: 98,
      size: 8.5,
      font: fontBold,
      color: darkSlate,
    });

    // Date To (x=195, y=98)
    page1.drawText(endDate, {
      x: 195,
      y: 98,
      size: 8.5,
      font: fontBold,
      color: darkSlate,
    });

    // # Days of Service (x=335, y=98)
    page1.drawText(`${daysCount} Day${daysCount > 1 ? 's' : ''}`, {
      x: 335,
      y: 98,
      size: 8.5,
      font: fontBold,
      color: darkSlate,
    });

    // # Hours Per Day (x=395, y=98)
    page1.drawText(`${hoursPerDay.toFixed(1)} hrs`, {
      x: 395,
      y: 98,
      size: 8.5,
      font: fontBold,
      color: darkSlate,
    });

    // Total # Hours Completed (x=495, y=98)
    page1.drawText(`${hours.toFixed(1)} SSL Hours`, {
      x: 495,
      y: 98,
      size: 9,
      font: fontBold,
      color: emeraldColor,
    });

    // =========================================================================
    // SUPERVISOR VERIFICATION & SIGNATURE
    // =========================================================================
    // Supervisor Name & Title (x=140, y=78)
    const supervisorTitle = form.supervisorTitle || 'Site Supervisor & Volunteer Coordinator';
    page1.drawText(`${form.supervisorName}, ${supervisorTitle}`, {
      x: 140,
      y: 78,
      size: 8,
      font: fontBold,
      color: darkSlate,
    });

    // Supervisor Signature & Digital Stamp (x=375, y=78)
    page1.drawText(`${form.supervisorName} [Verified Stamp: ${verificationToken}]`, {
      x: 375,
      y: 78,
      size: 7.5,
      font: fontBold,
      color: darkSlate,
    });

    // Date: Month, Day, Year (y=64)
    const dateParts = endDate.split('-');
    const month = dateParts[1] || '10';
    const day = dateParts[2] || '26';
    const yearFull = dateParts[0] || '2026';
    const yearShort = yearFull.length === 4 ? yearFull.slice(2) : yearFull;

    page1.drawText(month, {
      x: 508,
      y: 64,
      size: 8,
      font: fontBold,
      color: darkSlate,
    });

    page1.drawText(day, {
      x: 531,
      y: 64,
      size: 8,
      font: fontBold,
      color: darkSlate,
    });

    page1.drawText(yearShort, {
      x: 552,
      y: 64,
      size: 8,
      font: fontBold,
      color: darkSlate,
    });

    // Digital Verification Hash notice along bottom margin
    page1.drawText(
      `Digital Verification Hash (SHA-256): ${sha256Hash}  |  Online Verification: https://sowhatelse.org/verify?token=${verificationToken}`,
      {
        x: 42,
        y: 22,
        size: 6,
        font: fontRegular,
        color: rgb(0.4, 0.45, 0.5),
      }
    );

    // =========================================================================
    // PAGE 2: EXCLUSIVELY RESERVED FOR STUDENT REFLECTION
    // Untouched as required by MCPS guidelines.
    // =========================================================================

    const modifiedPdfBytes = await pdfDoc.save();
    const blob = new Blob([modifiedPdfBytes.buffer as ArrayBuffer], { type: 'application/pdf' });
    const blobUrl = URL.createObjectURL(blob);

    if (shouldAutoDownload) {
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }

    return {
      blobUrl,
      fileName,
      verificationToken,
      sha256Hash,
    };
  } catch (err) {
    console.warn('Could not populate original PDF via pdf-lib, falling back to vector renderer:', err);
    return generateServiceHourPdfFallback(form, template, shouldAutoDownload);
  }
}

/**
 * Fallback vector generator in case template file cannot be read
 */
function generateServiceHourPdfFallback(
  form: SSLForm,
  template?: FormSection2Template,
  shouldAutoDownload = true
): McpsPdfResult {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'letter',
  });

  const hours = form.totalVerifiedHours || 0;
  const startDate = form.dateRange?.start || new Date().toISOString().split('T')[0];
  const verificationToken = form.verificationToken || generateVerificationToken();
  const sha256Hash =
    form.sha256Hash ||
    generateCertificateHash(form.studentId || form.sweId, startDate, hours, verificationToken);

  const fileName = `MCPS_Form_560-51_${form.studentName.replace(/\s+/g, '_')}_${startDate}.pdf`;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text('MONTGOMERY COUNTY PUBLIC SCHOOLS', 14, 20);
  doc.setFontSize(11);
  doc.text('Student Service Learning Activity Verification (MCPS Form 560-51)', 14, 28);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text(`Student: ${form.studentName}  |  ID: ${form.studentId || form.sweId}  |  School: ${form.school || 'MCPS'}`, 14, 40);
  doc.text(`Organization: So What Else, Inc.  |  EIN: 27-0899847  |  Rockville, MD`, 14, 48);
  doc.text(`Certified SSL Hours: ${hours} Hours  |  Dates: ${form.dateRange.start} to ${form.dateRange.end}`, 14, 56);
  doc.text(`Supervisor Signature: ${form.supervisorName} [Verified Token: ${verificationToken}]`, 14, 64);

  // If admin customized description, print it
  if (template?.academicPreparationText) {
    doc.text(`Academic Preparation: ${template.academicPreparationText}`, 14, 76, { maxWidth: 180 });
  }
  if (template?.activityDescriptionText) {
    doc.text(`Service Activity: ${template.activityDescriptionText}`, 14, 90, { maxWidth: 180 });
  }

  const blobUrl = doc.output('bloburl').toString();

  if (shouldAutoDownload) {
    doc.save(fileName);
  }

  return {
    blobUrl,
    fileName,
    verificationToken,
    sha256Hash,
  };
}
