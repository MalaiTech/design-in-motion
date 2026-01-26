
import * as Print from 'expo-print';
import * as FileSystem from 'expo-file-system/legacy';
import { colors } from '@/styles/commonStyles';
import { Project, ExplorationLoop, Artifact, Decision, FramingDecision, ExplorationDecision, PhaseChangeEvent, TimeEntry, CostEntry, calculateProjectTotals } from './storage';
import { getPersonalInfo, PersonalInfo, getDefaultCurrency } from './profileStorage';

export type ExportFormat = 'executive' | 'process' | 'timeline' | 'costs';

// Helper to convert local image URI to base64 data URI
const convertImageToBase64 = async (uri: string): Promise<string | null> => {
  try {
    console.log('PDF Export: Converting image to base64:', uri);
    
    // Read the file as base64
    const base64 = await FileSystem.readAsStringAsync(uri, {
      encoding: FileSystem.EncodingType.Base64,
    });
    
    // Determine MIME type from file extension
    let mimeType = 'image/jpeg';
    if (uri.toLowerCase().endsWith('.png')) {
      mimeType = 'image/png';
    } else if (uri.toLowerCase().endsWith('.gif')) {
      mimeType = 'image/gif';
    } else if (uri.toLowerCase().endsWith('.webp')) {
      mimeType = 'image/webp';
    }
    
    const dataUri = `data:${mimeType};base64,${base64}`;
    console.log('PDF Export: Successfully converted image to base64 data URI');
    return dataUri;
  } catch (error) {
    console.error('PDF Export: Error converting image to base64:', error);
    return null;
  }
};

// Helper to format dates
const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return 'Invalid Date';
  return date.toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });
};

// Helper to get phase color
const getPhaseColor = (phase: string): string => {
  switch (phase) {
    case 'Framing': return '#1E4DD8';
    case 'Exploration': return '#F2C94C';
    case 'Pilot': return '#6B7280';
    case 'Delivery': return '#6B7280';
    case 'Finish': return '#D32F2F';
    default: return '#6B7280';
  }
};

// Helper to get phase surface color
const getPhaseSurface = (phase: string): string => {
  switch (phase) {
    case 'Framing': return '#EAF0FF';
    case 'Exploration': return '#FFF6D8';
    case 'Pilot': return '#EEF2F5';
    case 'Delivery': return '#E6E6E6';
    case 'Finish': return '#FDECEC';
    default: return '#F5F5F5';
  }
};

// Base HTML template with Bauhaus styling
const getBaseHTML = (title: string, content: string): string => {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      font-size: 11pt;
      line-height: 1.6;
      color: #111111;
      background: #FAFAF7;
      padding: 40px;
    }
    
    .page {
      max-width: 595px;
      margin: 0 auto;
      background: white;
      padding: 60px;
      page-break-after: always;
    }
    
    .page:last-child {
      page-break-after: auto;
    }
    
    h1 {
      font-size: 28pt;
      font-weight: 700;
      margin-bottom: 16px;
      color: #111111;
    }
    
    h2 {
      font-size: 20pt;
      font-weight: 600;
      margin-top: 32px;
      margin-bottom: 16px;
      color: #111111;
    }
    
    h3 {
      font-size: 16pt;
      font-weight: 600;
      margin-top: 24px;
      margin-bottom: 12px;
      color: #111111;
    }
    
    h4 {
      font-size: 13pt;
      font-weight: 600;
      margin-top: 16px;
      margin-bottom: 8px;
      color: #111111;
    }
    
    p {
      margin-bottom: 12px;
      color: #111111;
    }
    
    .meta {
      font-size: 10pt;
      color: #555555;
      margin-bottom: 8px;
    }
    
    .phase-badge {
      display: inline-block;
      padding: 6px 12px;
      font-size: 10pt;
      font-weight: 600;
      border-radius: 0;
      margin-bottom: 16px;
    }
    
    .divider {
      height: 2px;
      background: #DDDDDD;
      margin: 24px 0;
    }
    
    .section {
      margin-bottom: 32px;
      page-break-inside: avoid;
    }
    
    .list-item {
      margin-bottom: 8px;
      padding-left: 20px;
      position: relative;
    }
    
    .list-item:before {
      content: "•";
      position: absolute;
      left: 0;
      font-weight: bold;
    }
    
    .favorite-marker {
      color: #F2C94C;
      font-weight: bold;
      margin-right: 4px;
    }
    
    .decision-box {
      background: #EAF0FF;
      padding: 16px;
      margin: 16px 0;
      border-left: 4px solid #1E4DD8;
      page-break-inside: avoid;
    }
    
    .cost-table {
      width: 100%;
      border-collapse: collapse;
      margin: 16px 0;
      table-layout: fixed;
    }
    
    .cost-table th,
    .cost-table td {
      padding: 8px;
      text-align: left;
      border-bottom: 1px solid #DDDDDD;
    }
    
    .cost-table th {
      font-weight: 600;
      background: #F5F5F5;
    }
    
    .cost-table tr:last-child td {
      border-bottom: none;
    }
    
    .cost-table th:first-child,
    .cost-table td:first-child {
      width: 70%;
    }
    
    .cost-table th:last-child,
    .cost-table td:last-child {
      width: 30%;
      text-align: right;
    }
    
    .cost-table-loop {
      width: 100%;
      border-collapse: collapse;
      margin: 16px 0;
      table-layout: fixed;
    }
    
    .cost-table-loop th,
    .cost-table-loop td {
      padding: 8px;
      text-align: left;
      border-bottom: 1px solid #DDDDDD;
    }
    
    .cost-table-loop th {
      font-weight: 600;
      background: #F5F5F5;
    }
    
    .cost-table-loop tr:last-child td {
      border-bottom: none;
    }
    
    .cost-table-loop th:first-child,
    .cost-table-loop td:first-child {
      width: 50%;
    }
    
    .cost-table-loop th:nth-child(2),
    .cost-table-loop td:nth-child(2) {
      width: 25%;
      text-align: right;
    }
    
    .cost-table-loop th:nth-child(3),
    .cost-table-loop td:nth-child(3) {
      width: 25%;
      text-align: right;
    }
    
    .timeline-event {
      margin-bottom: 24px;
      padding-left: 24px;
      border-left: 3px solid #DDDDDD;
      position: relative;
      page-break-inside: avoid;
    }
    
    .timeline-event:before {
      content: "";
      position: absolute;
      left: -7px;
      top: 6px;
      width: 11px;
      height: 11px;
      border-radius: 50%;
      background: #1d6a89;
    }
    
    .timeline-event-framing {
      border-left-color: #1E4DD8;
    }
    
    .timeline-event-framing:before {
      background: #1E4DD8;
    }
    
    .timeline-event-exploration {
      border-left-color: #F2C94C;
    }
    
    .timeline-event-exploration:before {
      background: #F2C94C;
    }
    
    .cover-page {
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      min-height: 800px;
      padding: 80px 60px;
    }
    
    .cover-header {
      flex: 0;
    }
    
    .cover-center {
      flex: 1;
      display: flex;
      flex-direction: column;
      justify-content: center;
      text-align: center;
    }
    
    .cover-footer {
      flex: 0;
      border-top: 2px solid #DDDDDD;
      padding-top: 24px;
    }
    
    .cover-title {
      font-size: 42pt;
      font-weight: 700;
      margin-bottom: 24px;
      line-height: 1.2;
      letter-spacing: -1px;
    }
    
    .cover-subtitle {
      font-size: 20pt;
      color: #555555;
      margin-bottom: 48px;
      font-weight: 400;
    }
    
    .cover-meta {
      font-size: 12pt;
      color: #555555;
      line-height: 2;
      margin-top: 32px;
    }
    
    .cover-meta-item {
      margin-bottom: 8px;
    }
    
    .cover-meta-label {
      font-weight: 600;
      color: #111111;
      display: inline-block;
      min-width: 140px;
    }
    
    .cover-personal-info {
      font-size: 11pt;
      color: #555555;
      line-height: 1.8;
    }
    
    .cover-personal-info p {
      margin-bottom: 4px;
    }
    
    .cover-business-section {
      margin-top: 16px;
      padding-top: 16px;
      border-top: 1px solid #EEEEEE;
    }
    
    .cover-info-label {
      font-weight: 600;
      color: #111111;
      font-size: 10pt;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 8px;
    }
    
    .artifact-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 16px;
      margin: 16px 0 24px 0;
      page-break-inside: avoid;
    }
    
    .artifact-item {
      text-align: center;
    }
    
    .artifact-image {
      width: 100%;
      height: 150px;
      object-fit: cover;
      background: #F5F5F5;
      display: block;
    }
    
    .artifact-thumbnail {
      width: 100%;
      height: 120px;
      background: #F5F5F5;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 8px;
      font-size: 9pt;
      color: #555555;
    }
    
    .entry-item {
      padding: 12px 0;
      border-bottom: 1px solid #EEEEEE;
    }
    
    .entry-item:last-child {
      border-bottom: none;
    }
    
    .entry-description {
      font-size: 11pt;
      color: #111111;
      margin-bottom: 4px;
    }
    
    .entry-value {
      font-size: 10pt;
      color: #555555;
      font-weight: 600;
    }
    
    .loop-section {
      page-break-inside: avoid;
    }
    
    .segment-section {
      page-break-inside: avoid;
      margin-bottom: 24px;
    }
  </style>
</head>
<body>
  ${content}
</body>
</html>
  `;
};

// Generate Cover Page with Personal & Business Details
const generateCoverPage = async (project: Project, formatTitle: string): Promise<string> => {
  console.log('PDF Export: Generating cover page with personal info');
  const personalInfo = await getPersonalInfo();
  
  // Build personal info section - only show fields with content
  let personalInfoHTML = '';
  if (personalInfo) {
    const personalLines: string[] = [];
    const businessLines: string[] = [];
    
    // Personal details
    if (personalInfo.name) personalLines.push(`<p>${personalInfo.name}</p>`);
    if (personalInfo.email) personalLines.push(`<p>${personalInfo.email}</p>`);
    if (personalInfo.phone) personalLines.push(`<p>${personalInfo.phone}</p>`);
    
    // Business details
    if (personalInfo.businessName) businessLines.push(`<p><strong>${personalInfo.businessName}</strong></p>`);
    if (personalInfo.businessAddress) businessLines.push(`<p>${personalInfo.businessAddress}</p>`);
    if (personalInfo.website) businessLines.push(`<p>${personalInfo.website}</p>`);
    
    // Build the HTML sections
    let personalSection = '';
    let businessSection = '';
    
    if (personalLines.length > 0) {
      personalSection = `
        <div style="margin-bottom: 16px;">
          <div class="cover-info-label">Prepared By</div>
          ${personalLines.join('\n')}
        </div>
      `;
    }
    
    if (businessLines.length > 0) {
      businessSection = `
        <div class="cover-business-section">
          ${businessLines.join('\n')}
        </div>
      `;
    }
    
    if (personalSection || businessSection) {
      personalInfoHTML = `
        <div class="cover-personal-info">
          ${personalSection}
          ${businessSection}
        </div>
      `;
    }
  }
  
  return `
    <div class="page cover-page">
      <div class="cover-header">
        <!-- Reserved for future logo or branding -->
      </div>
      
      <div class="cover-center">
        <h1 class="cover-title">${project.title}</h1>
        <p class="cover-subtitle">${formatTitle}</p>
        
        <div class="cover-meta">
          <div class="cover-meta-item">
            <span class="cover-meta-label">Project Phase:</span>
            <span>${project.phase}</span>
          </div>
          <div class="cover-meta-item">
            <span class="cover-meta-label">Project Started:</span>
            <span>${formatDate(project.startDate)}</span>
          </div>
          <div class="cover-meta-item">
            <span class="cover-meta-label">Export Date:</span>
            <span>${formatDate(new Date().toISOString())}</span>
          </div>
        </div>
      </div>
      
      <div class="cover-footer">
        ${personalInfoHTML}
      </div>
    </div>
  `;
};

// Generate Executive Overview
const generateExecutiveOverview = async (project: Project): Promise<string> => {
  console.log('PDF Export: Generating Executive Overview');
  
  // NEW: Load currency
  const currency = await getDefaultCurrency();
  const currencySymbol = currency.symbol;
  console.log('PDF Export: Using currency symbol:', currencySymbol);
  
  const coverPage = await generateCoverPage(project, 'Executive Overview');
  
  // Calculate project totals
  const { totalHours, totalCosts } = calculateProjectTotals(project);
  
  // 2nd Page: Project Summary
  let summarySection = '';
  
  // Calculate exploration loop summaries
  let loopSummaries = '';
  if (project.explorationLoops && project.explorationLoops.length > 0) {
    loopSummaries = `
      <h3>Exploration Loops Status</h3>
      ${project.explorationLoops.map(loop => {
        const loopHours = loop.timeSpent || 0;
        const loopCosts = loop.costs || 0;
        const hoursDisplay = Math.round(loopHours);
        const costsDisplay = Math.round(loopCosts);
        return `
          <div style="margin-bottom: 16px;">
            <p><strong>${loop.question}</strong></p>
            <p class="meta">Status: ${loop.status} • Hours: ${hoursDisplay} h • Costs: ${currencySymbol}${costsDisplay}</p>
          </div>
        `;
      }).join('')}
    `;
  }
  
  const totalHoursDisplay = Math.round(totalHours);
  const totalCostsDisplay = Math.round(totalCosts);
  
  summarySection = `
    <div class="page">
      <h2>Project Summary</h2>
      <div class="divider"></div>
      <p><strong>Project Name:</strong> ${project.title}</p>
      ${project.purpose ? `<p><strong>Project Purpose:</strong> ${project.purpose}</p>` : ''}
      
      ${loopSummaries}
      
      <h3>Total Exploration Costs and Hours</h3>
      <table class="cost-table">
        <tr>
          <th>Metric</th>
          <th>Total</th>
        </tr>
        <tr>
          <td>Total Hours</td>
          <td>${totalHoursDisplay} h</td>
        </tr>
        <tr>
          <td>Total Costs</td>
          <td>${currencySymbol}${totalCostsDisplay}</td>
        </tr>
      </table>
    </div>
  `;
  
  // 3rd Page: Key Decisions (Project level and Framing, chronological)
  let decisionsSection = '';
  const allDecisions: {text: string, timestamp: string, type: string}[] = [];
  
  if (project.decisions && project.decisions.length > 0) {
    project.decisions.forEach(d => {
      allDecisions.push({
        text: d.summary,
        timestamp: d.timestamp,
        type: 'Project Decision'
      });
    });
  }
  
  if (project.framingDecisions && project.framingDecisions.length > 0) {
    project.framingDecisions.forEach(d => {
      allDecisions.push({
        text: d.summary,
        timestamp: d.timestamp,
        type: 'Framing Decision'
      });
    });
  }
  
  // Sort by timestamp
  allDecisions.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  
  if (allDecisions.length > 0) {
    decisionsSection = `
      <div class="page">
        <h2>Key Decisions</h2>
        <div class="divider"></div>
        ${allDecisions.map(d => `
          <div class="decision-box">
            <p class="meta">${d.type} • ${formatDate(d.timestamp)}</p>
            <p>${d.text}</p>
          </div>
        `).join('')}
      </div>
    `;
  }
  
  const content = coverPage + summarySection + decisionsSection;
  return getBaseHTML(`${project.title} - Executive Overview`, content);
};

// Helper function to render artifacts inline
const renderArtifactsInline = async (artifactIds: string[], allArtifacts: Artifact[]): Promise<string> => {
  const artifacts = allArtifacts.filter(a => 
    a.isFavorite && 
    a.type === 'image' && 
    artifactIds.includes(a.id)
  );
  
  if (artifacts.length === 0) {
    return '';
  }
  
  console.log('PDF Export: Rendering', artifacts.length, 'inline artifacts');
  
  // Convert artifacts to base64
  const artifactPromises = artifacts.map(async (artifact) => {
    const base64Uri = await convertImageToBase64(artifact.uri);
    return { artifact, base64Uri };
  });
  
  const artifactResults = await Promise.all(artifactPromises);
  const validArtifacts = artifactResults.filter(result => result.base64Uri !== null);
  
  console.log('PDF Export: Successfully converted', validArtifacts.length, 'images to base64');
  
  if (validArtifacts.length === 0) {
    return '';
  }
  
  return `
    <div class="artifact-grid">
      ${validArtifacts.map(({ artifact, base64Uri }) => `
        <div class="artifact-item">
          <img src="${base64Uri}" class="artifact-image" alt="${artifact.name || 'Artifact'}" />
        </div>
      `).join('')}
    </div>
  `;
};

// Generate Design Process Report
const generateDesignProcessReport = async (project: Project): Promise<string> => {
  console.log('PDF Export: Generating Design Process Report');
  const coverPage = await generateCoverPage(project, 'Design Process Report');
  
  // 2nd Page: Design Framing (with inline artifacts directly below Purpose)
  let framingSection = '';
  const hasFramingContent = project.opportunityOrigin || project.purpose || 
    (project.certaintyItems && project.certaintyItems.length > 0) || 
    (project.designSpaceItems && project.designSpaceItems.length > 0) ||
    (project.explorationQuestions && project.explorationQuestions.length > 0) ||
    (project.framingDecisions && project.framingDecisions.length > 0);
  
  if (hasFramingContent) {
    // Get favorite artifacts for Framing phase using framingArtifactIds
    const framingArtifactIds = project.framingArtifactIds || [];
    const framingArtifactsHTML = await renderArtifactsInline(framingArtifactIds, project.artifacts);
    
    framingSection = `
      <div class="page">
        <h2>Design Framing</h2>
        <div class="divider"></div>
        
        ${project.opportunityOrigin ? `
          <div class="section">
            <h3>Opportunity Origin</h3>
            <p>${project.opportunityOrigin}</p>
          </div>
        ` : ''}
        
        ${project.purpose ? `
          <div class="section">
            <h3>Purpose</h3>
            <p>${project.purpose}</p>
            ${framingArtifactsHTML}
          </div>
        ` : framingArtifactsHTML ? `<div class="section">${framingArtifactsHTML}</div>` : ''}
        
        ${project.certaintyItems && project.certaintyItems.length > 0 ? `
          <div class="section">
            <h3>Certainty Mapping</h3>
            ${project.certaintyItems.filter(c => c.category === 'known').length > 0 ? `
              <h4>Known</h4>
              ${project.certaintyItems.filter(c => c.category === 'known').map(c => `
                <div class="list-item">${c.text}</div>
              `).join('')}
            ` : ''}
            ${project.certaintyItems.filter(c => c.category === 'assumed').length > 0 ? `
              <h4>Assumed</h4>
              ${project.certaintyItems.filter(c => c.category === 'assumed').map(c => `
                <div class="list-item">${c.text}</div>
              `).join('')}
            ` : ''}
            ${project.certaintyItems.filter(c => c.category === 'unknown').length > 0 ? `
              <h4>Unknown</h4>
              ${project.certaintyItems.filter(c => c.category === 'unknown').map(c => `
                <div class="list-item">${c.text}</div>
              `).join('')}
            ` : ''}
          </div>
        ` : ''}
        
        ${project.designSpaceItems && project.designSpaceItems.length > 0 ? `
          <div class="section">
            <h3>Design Space</h3>
            ${project.designSpaceItems.map(d => `
              <div class="list-item">${d.text}</div>
            `).join('')}
          </div>
        ` : ''}
        
        ${project.explorationQuestions && project.explorationQuestions.length > 0 ? `
          <div class="section">
            <h3>First Exploration Questions</h3>
            ${project.explorationQuestions.map(q => `
              <div class="list-item">
                ${q.isFavorite ? '<span class="favorite-marker">★</span> ' : ''}${q.text}
              </div>
            `).join('')}
          </div>
        ` : ''}
        
        ${project.framingDecisions && project.framingDecisions.length > 0 ? `
          <div class="section">
            <h3>Framing Decisions</h3>
            ${project.framingDecisions.map(d => `
              <div class="decision-box">
                <p class="meta">${formatDate(d.timestamp)}</p>
                <p>${d.summary}</p>
              </div>
            `).join('')}
          </div>
        ` : ''}
      </div>
    `;
  }
  
  // Next Pages: Exploration Loops (each loop on its own page, segments prevent page breaks)
  let explorationSection = '';
  if (project.explorationLoops && project.explorationLoops.length > 0) {
    const loopSections = await Promise.all(
      project.explorationLoops.map(async (loop) => {
        console.log('PDF Export: Processing loop:', loop.question);
        
        // Render artifacts for each segment
        const exploreArtifactsHTML = await renderArtifactsInline(loop.exploreArtifactIds || [], project.artifacts);
        const buildArtifactsHTML = await renderArtifactsInline(loop.buildArtifactIds || [], project.artifacts);
        const checkArtifactsHTML = await renderArtifactsInline(loop.checkArtifactIds || [], project.artifacts);
        const adaptArtifactsHTML = await renderArtifactsInline(loop.adaptArtifactIds || [], project.artifacts);
        const decisionsArtifactsHTML = await renderArtifactsInline(loop.decisionsArtifactIds || [], project.artifacts);
        
        return `
          <div class="page">
            <h2>Exploration Loop: ${loop.question}</h2>
            <div class="divider"></div>
            <p class="meta">Status: ${loop.status} • Started: ${formatDate(loop.startDate)}</p>
            
            ${loop.exploreItems && loop.exploreItems.length > 0 ? `
              <div class="segment-section">
                <h3>Explore</h3>
                ${loop.exploreItems.map(item => `
                  <div class="list-item">
                    ${item.isFavorite ? '<span class="favorite-marker">★</span> ' : ''}${item.text}
                  </div>
                `).join('')}
                ${exploreArtifactsHTML}
              </div>
            ` : ''}
            
            ${loop.buildItems && loop.buildItems.length > 0 ? `
              <div class="segment-section">
                <h3>Build</h3>
                ${loop.buildItems.map(item => `
                  <div class="list-item">
                    ${item.isFavorite ? '<span class="favorite-marker">★</span> ' : ''}${item.text}
                  </div>
                `).join('')}
                ${buildArtifactsHTML}
              </div>
            ` : ''}
            
            ${loop.checkItems && loop.checkItems.length > 0 ? `
              <div class="segment-section">
                <h3>Check</h3>
                ${loop.checkItems.map(item => `
                  <div class="list-item">
                    ${item.isFavorite ? '<span class="favorite-marker">★</span> ' : ''}${item.text}
                  </div>
                `).join('')}
                ${checkArtifactsHTML}
              </div>
            ` : ''}
            
            ${loop.adaptItems && loop.adaptItems.length > 0 ? `
              <div class="segment-section">
                <h3>Adapt</h3>
                ${loop.adaptItems.map(item => `
                  <div class="list-item">
                    ${item.isFavorite ? '<span class="favorite-marker">★</span> ' : ''}${item.text}
                  </div>
                `).join('')}
                ${adaptArtifactsHTML}
              </div>
            ` : ''}
            
            ${loop.explorationDecisions && loop.explorationDecisions.length > 0 ? `
              <div class="segment-section">
                <h3>Decisions</h3>
                ${loop.explorationDecisions.map(d => `
                  <div class="decision-box">
                    <p class="meta">${formatDate(d.timestamp)}</p>
                    <p>${d.summary}</p>
                  </div>
                `).join('')}
                ${decisionsArtifactsHTML}
              </div>
            ` : ''}
            
            ${loop.nextExplorationQuestions && loop.nextExplorationQuestions.length > 0 ? `
              <div class="segment-section">
                <h3>Next Exploration Questions</h3>
                ${loop.nextExplorationQuestions.map(q => `
                  <div class="list-item">
                    ${q.isFavorite ? '<span class="favorite-marker">★</span> ' : ''}${q.text}
                  </div>
                `).join('')}
              </div>
            ` : ''}
          </div>
        `;
      })
    );
    
    explorationSection = loopSections.join('');
  }
  
  const content = coverPage + framingSection + explorationSection;
  return getBaseHTML(`${project.title} - Design Process Report`, content);
};

// Generate Timeline Report - UPDATED: Remove images, add color coding for Framing vs Exploration
const generateTimelineReport = async (project: Project): Promise<string> => {
  console.log('PDF Export: Generating Timeline Report');
  const coverPage = await generateCoverPage(project, 'Timeline');
  
  // Build timeline events
  const timelineEvents: {timestamp: string, type: string, content: string, category: 'framing' | 'exploration' | 'other'}[] = [];
  
  // Project created
  timelineEvents.push({
    timestamp: project.startDate,
    type: 'Project Created',
    content: `Project "${project.title}" was created`,
    category: 'other'
  });
  
  // Phase changes
  if (project.phaseHistory && project.phaseHistory.length > 0) {
    project.phaseHistory.forEach(event => {
      timelineEvents.push({
        timestamp: event.timestamp,
        type: 'Phase Change',
        content: `Phase changed to ${event.phase}`,
        category: 'other'
      });
    });
  }
  
  // Framing decisions - marked as Framing category
  if (project.framingDecisions && project.framingDecisions.length > 0) {
    project.framingDecisions.forEach(d => {
      timelineEvents.push({
        timestamp: d.timestamp,
        type: 'Framing Decision',
        content: d.summary,
        category: 'framing'
      });
    });
  }
  
  // Exploration loops - marked as Exploration category
  if (project.explorationLoops && project.explorationLoops.length > 0) {
    project.explorationLoops.forEach(loop => {
      timelineEvents.push({
        timestamp: loop.startDate,
        type: 'Exploration Loop',
        content: `Started exploration: ${loop.question}`,
        category: 'exploration'
      });
      
      // Loop decisions - also marked as Exploration category
      if (loop.explorationDecisions && loop.explorationDecisions.length > 0) {
        loop.explorationDecisions.forEach(d => {
          timelineEvents.push({
            timestamp: d.timestamp,
            type: 'Exploration Decision',
            content: d.summary,
            category: 'exploration'
          });
        });
      }
    });
  }
  
  // Project decisions
  if (project.decisions && project.decisions.length > 0) {
    project.decisions.forEach(d => {
      timelineEvents.push({
        timestamp: d.timestamp,
        type: 'Project Decision',
        content: d.summary,
        category: 'other'
      });
    });
  }
  
  // Sort chronologically
  timelineEvents.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  
  const timelineContent = timelineEvents.length > 0 ? `
    <div class="page">
      <h2>Project Timeline</h2>
      <div class="divider"></div>
      ${timelineEvents.map(event => {
        // Determine CSS class based on category
        const categoryClass = event.category === 'framing' 
          ? 'timeline-event-framing' 
          : event.category === 'exploration' 
            ? 'timeline-event-exploration' 
            : '';
        
        return `
          <div class="timeline-event ${categoryClass}">
            <p class="meta">${event.type} • ${formatDate(event.timestamp)}</p>
            <p>${event.content}</p>
          </div>
        `;
      }).join('')}
    </div>
  ` : '<div class="page"><p>No timeline events recorded.</p></div>';
  
  const content = coverPage + timelineContent;
  return getBaseHTML(`${project.title} - Timeline`, content);
};

// Generate Costs & Hours Report - FIXED: No decimals, use "h" instead of "hours", wider columns for per-loop table
const generateCostsReport = async (project: Project): Promise<string> => {
  console.log('PDF Export: Generating Costs & Hours Report');
  
  // NEW: Load currency
  const currency = await getDefaultCurrency();
  const currencySymbol = currency.symbol;
  console.log('PDF Export: Using currency symbol for costs report:', currencySymbol);
  
  const coverPage = await generateCoverPage(project, 'Costs & Hours Report');
  
  // Calculate project totals
  const { totalHours, totalCosts } = calculateProjectTotals(project);
  
  // Calculate per-loop totals
  let loopTotals: {loopId: string, question: string, hours: number, costs: number}[] = [];
  if (project.explorationLoops && project.explorationLoops.length > 0) {
    loopTotals = project.explorationLoops.map(loop => ({
      loopId: loop.id,
      question: loop.question,
      hours: loop.timeSpent || 0,
      costs: loop.costs || 0
    }));
  }
  
  // If no data, only show cover and overview
  if (totalHours === 0 && totalCosts === 0 && loopTotals.every(l => l.hours === 0 && l.costs === 0)) {
    const content = coverPage + `
      <div class="page">
        <h2>Cost & Time Overview</h2>
        <div class="divider"></div>
        <p>No costs or hours have been recorded for this project.</p>
      </div>
    `;
    return getBaseHTML(`${project.title} - Costs & Hours Report`, content);
  }
  
  // Round all values to remove decimals
  const totalHoursDisplay = Math.round(totalHours);
  const totalCostsDisplay = Math.round(totalCosts);
  
  // 2nd Page: Total Cost & Total Time Overview (Overall + Per Loop)
  const overviewSection = `
    <div class="page">
      <h2>Cost & Time Overview</h2>
      <div class="divider"></div>
      
      <h3>Overall Project Totals</h3>
      <table class="cost-table">
        <tr>
          <th>Metric</th>
          <th>Total</th>
        </tr>
        <tr>
          <td>Total Hours</td>
          <td>${totalHoursDisplay} h</td>
        </tr>
        <tr>
          <td>Total Costs</td>
          <td>${currencySymbol}${totalCostsDisplay}</td>
        </tr>
      </table>
      
      ${loopTotals.length > 0 ? `
        <h3>Per Exploration Loop</h3>
        <table class="cost-table-loop">
          <tr>
            <th>Loop</th>
            <th>Hours</th>
            <th>Costs</th>
          </tr>
          ${loopTotals.map(loop => {
            const loopHoursDisplay = Math.round(loop.hours);
            const loopCostsDisplay = Math.round(loop.costs);
            return `
              <tr>
                <td>${loop.question}</td>
                <td>${loopHoursDisplay} h</td>
                <td>${currencySymbol}${loopCostsDisplay}</td>
              </tr>
            `;
          }).join('')}
        </table>
      ` : ''}
    </div>
  `;
  
  // Next Pages: Breakdown by Exploration Loop with individual entries in table format
  let loopBreakdown = '';
  if (project.explorationLoops && project.explorationLoops.length > 0) {
    loopBreakdown = project.explorationLoops.map(loop => {
      const timeEntries = loop.timeEntries || [];
      const costEntries = loop.costEntries || [];
      
      // Skip loops with no entries
      if (timeEntries.length === 0 && costEntries.length === 0) {
        return '';
      }
      
      return `
        <div class="page">
          <h2>Loop: ${loop.question}</h2>
          <div class="divider"></div>
          <p class="meta">Status: ${loop.status} • Started: ${formatDate(loop.startDate)}</p>
          
          ${timeEntries.length > 0 ? `
            <h3>Time Entries</h3>
            <table class="cost-table">
              <tr>
                <th>Description</th>
                <th>Hours</th>
              </tr>
              ${timeEntries.map((entry: TimeEntry) => {
                const entryHoursDisplay = Math.round(entry.hours);
                return `
                  <tr>
                    <td>${entry.reason}</td>
                    <td>${entryHoursDisplay} h</td>
                  </tr>
                `;
              }).join('')}
            </table>
          ` : ''}
          
          ${costEntries.length > 0 ? `
            <h3>Cost Entries</h3>
            <table class="cost-table">
              <tr>
                <th>Description</th>
                <th>Amount</th>
              </tr>
              ${costEntries.map((entry: CostEntry) => {
                const entryAmountDisplay = Math.round(entry.amount);
                return `
                  <tr>
                    <td>${entry.reason}</td>
                    <td>${currencySymbol}${entryAmountDisplay}</td>
                  </tr>
                `;
              }).join('')}
            </table>
          ` : ''}
        </div>
      `;
    }).join('');
  }
  
  const content = coverPage + overviewSection + loopBreakdown;
  return getBaseHTML(`${project.title} - Costs & Hours Report`, content);
};

// Main export function using expo-print
export const exportProjectToPDF = async (
  project: Project,
  format: ExportFormat
): Promise<string> => {
  console.log('PDF Export: Generating PDF', { projectId: project.id, format });
  
  let htmlContent = '';
  let fileName = '';
  
  switch (format) {
    case 'executive':
      htmlContent = await generateExecutiveOverview(project);
      fileName = `${project.title}_Executive_Overview`;
      break;
    case 'process':
      // Design Process Report needs async image conversion
      htmlContent = await generateDesignProcessReport(project);
      fileName = `${project.title}_Design_Process`;
      break;
    case 'timeline':
      htmlContent = await generateTimelineReport(project);
      fileName = `${project.title}_Timeline`;
      break;
    case 'costs':
      htmlContent = await generateCostsReport(project);
      fileName = `${project.title}_Costs_Hours`;
      break;
    default:
      throw new Error(`Unknown export format: ${format}`);
  }
  
  // Sanitize filename
  fileName = fileName.replace(/[^a-z0-9_\-]/gi, '_');
  
  try {
    const { uri } = await Print.printToFileAsync({
      html: htmlContent,
    });
    
    console.log('PDF Export: PDF generated successfully', uri);
    return uri;
  } catch (error) {
    console.error('PDF Export: Error generating PDF', error);
    throw error;
  }
};
