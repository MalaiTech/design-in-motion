
import * as Print from 'expo-print';
import { colors } from '@/styles/commonStyles';
import { Project, ExplorationLoop, Artifact, Decision, FramingDecision, ExplorationDecision, PhaseChangeEvent, TimeEntry, CostEntry, calculateProjectTotals } from './storage';

export type ExportFormat = 'executive' | 'process' | 'timeline' | 'costs';

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
    }
    
    .cost-table {
      width: 100%;
      border-collapse: collapse;
      margin: 16px 0;
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
    
    .timeline-event {
      margin-bottom: 24px;
      padding-left: 24px;
      border-left: 3px solid #DDDDDD;
      position: relative;
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
    
    .cover-page {
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      min-height: 800px;
      text-align: center;
    }
    
    .cover-title {
      font-size: 36pt;
      font-weight: 700;
      margin-bottom: 24px;
    }
    
    .cover-subtitle {
      font-size: 18pt;
      color: #555555;
      margin-bottom: 48px;
    }
    
    .cover-meta {
      font-size: 12pt;
      color: #555555;
      line-height: 2;
    }
    
    .artifact-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 16px;
      margin: 24px 0;
    }
    
    .artifact-item {
      text-align: center;
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
  </style>
</head>
<body>
  ${content}
</body>
</html>
  `;
};

// Generate Cover Page
const generateCoverPage = (project: Project, formatTitle: string): string => {
  return `
    <div class="page cover-page">
      <h1 class="cover-title">${project.title}</h1>
      <p class="cover-subtitle">${formatTitle}</p>
      <div class="cover-meta">
        <p><strong>Phase:</strong> ${project.phase}</p>
        <p><strong>Project Started:</strong> ${formatDate(project.startDate)}</p>
        <p><strong>Export Date:</strong> ${formatDate(new Date().toISOString())}</p>
      </div>
    </div>
  `;
};

// Generate Executive Overview
const generateExecutiveOverview = (project: Project): string => {
  const coverPage = generateCoverPage(project, 'Executive Overview');
  
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
        return `
          <div style="margin-bottom: 16px;">
            <p><strong>${loop.question}</strong></p>
            <p class="meta">Status: ${loop.status} • Hours: ${loopHours.toFixed(1)} • Costs: $${loopCosts.toFixed(2)}</p>
          </div>
        `;
      }).join('')}
    `;
  }
  
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
          <td>${totalHours.toFixed(1)} hours</td>
        </tr>
        <tr>
          <td>Total Costs</td>
          <td>$${totalCosts.toFixed(2)}</td>
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

// Generate Design Process Report
const generateDesignProcessReport = (project: Project): string => {
  const coverPage = generateCoverPage(project, 'Design Process Report');
  
  // 2nd Page: Key Artifacts (favorites only, max 3 per row in grid)
  let artifactsSection = '';
  const favoriteArtifacts = project.artifacts.filter(a => a.isFavorite && a.type !== 'url');
  if (favoriteArtifacts.length > 0) {
    artifactsSection = `
      <div class="page">
        <h2>Key Artifacts</h2>
        <div class="divider"></div>
        <div class="artifact-grid">
          ${favoriteArtifacts.map(a => `
            <div class="artifact-item">
              <div class="artifact-thumbnail">
                <span class="favorite-marker">★</span> ${a.name || 'Artifact'}
              </div>
              ${a.caption ? `<p class="meta">${a.caption}</p>` : ''}
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }
  
  // 3rd Page: Design Framing (All segments incl. First Exploration Questions and Framing decisions)
  let framingSection = '';
  const hasFramingContent = project.opportunityOrigin || project.purpose || 
    (project.certaintyItems && project.certaintyItems.length > 0) || 
    (project.designSpaceItems && project.designSpaceItems.length > 0) ||
    (project.explorationQuestions && project.explorationQuestions.length > 0) ||
    (project.framingDecisions && project.framingDecisions.length > 0);
  
  if (hasFramingContent) {
    framingSection = `
      <div class="page">
        <h2>Design Framing</h2>
        <div class="divider"></div>
        
        ${project.opportunityOrigin ? `
          <h3>Opportunity Origin</h3>
          <p>${project.opportunityOrigin}</p>
        ` : ''}
        
        ${project.purpose ? `
          <h3>Purpose</h3>
          <p>${project.purpose}</p>
        ` : ''}
        
        ${project.certaintyItems && project.certaintyItems.length > 0 ? `
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
        ` : ''}
        
        ${project.designSpaceItems && project.designSpaceItems.length > 0 ? `
          <h3>Design Space</h3>
          ${project.designSpaceItems.map(d => `
            <div class="list-item">${d.text}</div>
          `).join('')}
        ` : ''}
        
        ${project.explorationQuestions && project.explorationQuestions.length > 0 ? `
          <h3>First Exploration Questions</h3>
          ${project.explorationQuestions.map(q => `
            <div class="list-item">
              ${q.isFavorite ? '<span class="favorite-marker">★</span> ' : ''}${q.text}
            </div>
          `).join('')}
        ` : ''}
        
        ${project.framingDecisions && project.framingDecisions.length > 0 ? `
          <h3>Framing Decisions</h3>
          ${project.framingDecisions.map(d => `
            <div class="decision-box">
              <p class="meta">${formatDate(d.timestamp)}</p>
              <p>${d.summary}</p>
            </div>
          `).join('')}
        ` : ''}
      </div>
    `;
  }
  
  // Next Pages: Exploration Lanes (each loop grouped, Add Next exploration Questions, Add Star icon for favorites)
  let explorationSection = '';
  if (project.explorationLoops && project.explorationLoops.length > 0) {
    explorationSection = project.explorationLoops.map(loop => {
      const loopArtifacts = project.artifacts.filter(a => loop.artifactIds.includes(a.id) && a.isFavorite);
      
      return `
        <div class="page">
          <h2>Exploration Loop: ${loop.question}</h2>
          <div class="divider"></div>
          <p class="meta">Status: ${loop.status} • Started: ${formatDate(loop.startDate)}</p>
          
          ${loop.exploreItems && loop.exploreItems.length > 0 ? `
            <h3>Explore</h3>
            ${loop.exploreItems.map(item => `
              <div class="list-item">
                ${item.isFavorite ? '<span class="favorite-marker">★</span> ' : ''}${item.text}
              </div>
            `).join('')}
          ` : ''}
          
          ${loop.buildItems && loop.buildItems.length > 0 ? `
            <h3>Build</h3>
            ${loop.buildItems.map(item => `
              <div class="list-item">
                ${item.isFavorite ? '<span class="favorite-marker">★</span> ' : ''}${item.text}
              </div>
            `).join('')}
          ` : ''}
          
          ${loop.checkItems && loop.checkItems.length > 0 ? `
            <h3>Check</h3>
            ${loop.checkItems.map(item => `
              <div class="list-item">
                ${item.isFavorite ? '<span class="favorite-marker">★</span> ' : ''}${item.text}
              </div>
            `).join('')}
          ` : ''}
          
          ${loop.adaptItems && loop.adaptItems.length > 0 ? `
            <h3>Adapt</h3>
            ${loop.adaptItems.map(item => `
              <div class="list-item">
                ${item.isFavorite ? '<span class="favorite-marker">★</span> ' : ''}${item.text}
              </div>
            `).join('')}
          ` : ''}
          
          ${loop.explorationDecisions && loop.explorationDecisions.length > 0 ? `
            <h3>Decisions</h3>
            ${loop.explorationDecisions.map(d => `
              <div class="decision-box">
                <p class="meta">${formatDate(d.timestamp)}</p>
                <p>${d.summary}</p>
              </div>
            `).join('')}
          ` : ''}
          
          ${loop.nextExplorationQuestions && loop.nextExplorationQuestions.length > 0 ? `
            <h3>Next Exploration Questions</h3>
            ${loop.nextExplorationQuestions.map(q => `
              <div class="list-item">
                ${q.isFavorite ? '<span class="favorite-marker">★</span> ' : ''}${q.text}
              </div>
            `).join('')}
          ` : ''}
          
          ${loopArtifacts.length > 0 ? `
            <h3>Key Artifacts</h3>
            ${loopArtifacts.map(a => `
              <div class="list-item">
                <span class="favorite-marker">★</span> ${a.name || a.uri}
              </div>
            `).join('')}
          ` : ''}
        </div>
      `;
    }).join('');
  }
  
  const content = coverPage + artifactsSection + framingSection + explorationSection;
  return getBaseHTML(`${project.title} - Design Process Report`, content);
};

// Generate Timeline Report
const generateTimelineReport = (project: Project): string => {
  const coverPage = generateCoverPage(project, 'Timeline');
  
  // Build timeline events
  const timelineEvents: {timestamp: string, type: string, content: string, artifacts?: Artifact[]}[] = [];
  
  // Project created
  timelineEvents.push({
    timestamp: project.startDate,
    type: 'Project Created',
    content: `Project "${project.title}" was created`
  });
  
  // Phase changes
  if (project.phaseHistory && project.phaseHistory.length > 0) {
    project.phaseHistory.forEach(event => {
      timelineEvents.push({
        timestamp: event.timestamp,
        type: 'Phase Change',
        content: `Phase changed to ${event.phase}`
      });
    });
  }
  
  // Framing decisions
  if (project.framingDecisions && project.framingDecisions.length > 0) {
    project.framingDecisions.forEach(d => {
      const artifacts = project.artifacts.filter(a => d.artifacts.includes(a.id) && a.isFavorite);
      timelineEvents.push({
        timestamp: d.timestamp,
        type: 'Framing Decision',
        content: d.summary,
        artifacts: artifacts.length > 0 ? artifacts : undefined
      });
    });
  }
  
  // Exploration loops
  if (project.explorationLoops && project.explorationLoops.length > 0) {
    project.explorationLoops.forEach(loop => {
      const loopArtifacts = project.artifacts.filter(a => loop.artifactIds.includes(a.id) && a.isFavorite);
      timelineEvents.push({
        timestamp: loop.startDate,
        type: 'Exploration Loop',
        content: `Started exploration: ${loop.question}`,
        artifacts: loopArtifacts.length > 0 ? loopArtifacts : undefined
      });
      
      // Loop decisions
      if (loop.explorationDecisions && loop.explorationDecisions.length > 0) {
        loop.explorationDecisions.forEach(d => {
          timelineEvents.push({
            timestamp: d.timestamp,
            type: 'Exploration Decision',
            content: d.summary
          });
        });
      }
    });
  }
  
  // Project decisions
  if (project.decisions && project.decisions.length > 0) {
    project.decisions.forEach(d => {
      const artifacts = project.artifacts.filter(a => d.artifacts.includes(a.id) && a.isFavorite);
      timelineEvents.push({
        timestamp: d.timestamp,
        type: 'Project Decision',
        content: d.summary,
        artifacts: artifacts.length > 0 ? artifacts : undefined
      });
    });
  }
  
  // Sort chronologically
  timelineEvents.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  
  const timelineContent = timelineEvents.length > 0 ? `
    <div class="page">
      <h2>Project Timeline</h2>
      <div class="divider"></div>
      ${timelineEvents.map(event => `
        <div class="timeline-event">
          <p class="meta">${event.type} • ${formatDate(event.timestamp)}</p>
          <p>${event.content}</p>
          ${event.artifacts && event.artifacts.length > 0 ? `
            <div style="margin-top: 8px;">
              ${event.artifacts.map(a => `
                <div class="list-item">
                  <span class="favorite-marker">★</span> ${a.name || a.uri}
                </div>
              `).join('')}
            </div>
          ` : ''}
        </div>
      `).join('')}
    </div>
  ` : '<div class="page"><p>No timeline events recorded.</p></div>';
  
  const content = coverPage + timelineContent;
  return getBaseHTML(`${project.title} - Timeline`, content);
};

// Generate Costs & Hours Report
const generateCostsReport = (project: Project): string => {
  const coverPage = generateCoverPage(project, 'Costs & Hours Report');
  
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
          <td>${totalHours.toFixed(1)} hours</td>
        </tr>
        <tr>
          <td>Total Costs</td>
          <td>$${totalCosts.toFixed(2)}</td>
        </tr>
      </table>
      
      ${loopTotals.length > 0 ? `
        <h3>Per Exploration Loop</h3>
        <table class="cost-table">
          <tr>
            <th>Loop</th>
            <th>Hours</th>
            <th>Costs</th>
          </tr>
          ${loopTotals.map(loop => `
            <tr>
              <td>${loop.question}</td>
              <td>${loop.hours.toFixed(1)} hours</td>
              <td>$${loop.costs.toFixed(2)}</td>
            </tr>
          `).join('')}
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
              ${timeEntries.map((entry: TimeEntry) => `
                <tr>
                  <td>${entry.reason}</td>
                  <td>${entry.hours.toFixed(1)} hours</td>
                </tr>
              `).join('')}
            </table>
          ` : ''}
          
          ${costEntries.length > 0 ? `
            <h3>Cost Entries</h3>
            <table class="cost-table">
              <tr>
                <th>Description</th>
                <th>Amount</th>
              </tr>
              ${costEntries.map((entry: CostEntry) => `
                <tr>
                  <td>${entry.reason}</td>
                  <td>$${entry.amount.toFixed(2)}</td>
                </tr>
              `).join('')}
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
      htmlContent = generateExecutiveOverview(project);
      fileName = `${project.title}_Executive_Overview`;
      break;
    case 'process':
      htmlContent = generateDesignProcessReport(project);
      fileName = `${project.title}_Design_Process`;
      break;
    case 'timeline':
      htmlContent = generateTimelineReport(project);
      fileName = `${project.title}_Timeline`;
      break;
    case 'costs':
      htmlContent = generateCostsReport(project);
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
