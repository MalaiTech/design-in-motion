
import * as Print from 'expo-print';
import { colors } from '@/styles/commonStyles';
import { Project, ExplorationLoop, Artifact, Decision, FramingDecision, ExplorationDecision, PhaseChangeEvent } from './storage';

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
        <p><strong>Export Date:</strong> ${formatDate(new Date().toISOString())}</p>
        <p><strong>Project Started:</strong> ${formatDate(project.startDate)}</p>
      </div>
    </div>
  `;
};

// Generate Executive Overview
const generateExecutiveOverview = (project: Project): string => {
  const coverPage = generateCoverPage(project, 'Executive Overview');
  
  // Project Snapshot
  let snapshotSection = '';
  if (project.title || project.phase || project.startDate) {
    snapshotSection = `
      <div class="page">
        <h2>Project Snapshot</h2>
        <div class="divider"></div>
        <p><strong>Project Name:</strong> ${project.title}</p>
        <p><strong>Current Phase:</strong> <span class="phase-badge" style="background: ${getPhaseSurface(project.phase)}; color: ${getPhaseColor(project.phase)};">${project.phase}</span></p>
        <p><strong>Started:</strong> ${formatDate(project.startDate)}</p>
        <p><strong>Last Updated:</strong> ${formatDate(project.updatedDate)}</p>
      </div>
    `;
  }
  
  // Purpose & Intent
  let purposeSection = '';
  if (project.opportunityOrigin || project.purpose) {
    purposeSection = `
      <div class="page">
        <h2>Purpose & Intent</h2>
        <div class="divider"></div>
        ${project.opportunityOrigin ? `
          <h3>Opportunity Origin</h3>
          <p>${project.opportunityOrigin}</p>
        ` : ''}
        ${project.purpose ? `
          <h3>Purpose</h3>
          <p>${project.purpose}</p>
        ` : ''}
      </div>
    `;
  }
  
  // Key Decisions (Project level and Framing)
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
  
  // Costs & Hours Summary
  let costsSection = '';
  const totalHours = project.hours || 0;
  const totalCosts = project.costs || 0;
  
  if (totalHours > 0 || totalCosts > 0) {
    costsSection = `
      <div class="page">
        <h2>Costs & Hours Summary</h2>
        <div class="divider"></div>
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
  }
  
  // Current Status
  const statusSection = `
    <div class="page">
      <h2>Current Status</h2>
      <div class="divider"></div>
      <p><strong>Phase:</strong> ${project.phase}</p>
      <p><strong>Last Updated:</strong> ${formatDate(project.updatedDate)}</p>
      ${project.explorationLoops && project.explorationLoops.length > 0 ? `
        <p><strong>Exploration Loops:</strong> ${project.explorationLoops.length} loop(s)</p>
        <p><strong>Active Loops:</strong> ${project.explorationLoops.filter(l => l.status === 'active').length}</p>
        <p><strong>Completed Loops:</strong> ${project.explorationLoops.filter(l => l.status === 'completed').length}</p>
      ` : ''}
    </div>
  `;
  
  const content = coverPage + snapshotSection + purposeSection + decisionsSection + costsSection + statusSection;
  return getBaseHTML(`${project.title} - Executive Overview`, content);
};

// Generate Design Process Report
const generateDesignProcessReport = (project: Project): string => {
  const coverPage = generateCoverPage(project, 'Design Process Report');
  
  // Key Artifacts (favorites only)
  let artifactsSection = '';
  const favoriteArtifacts = project.artifacts.filter(a => a.isFavorite);
  if (favoriteArtifacts.length > 0) {
    artifactsSection = `
      <div class="page">
        <h2>Key Artifacts</h2>
        <div class="divider"></div>
        ${favoriteArtifacts.map(a => `
          <div class="list-item">
            <span class="favorite-marker">★</span> ${a.name || a.uri}
            ${a.caption ? `<p class="meta">${a.caption}</p>` : ''}
          </div>
        `).join('')}
      </div>
    `;
  }
  
  // Design Context (full framing)
  let framingSection = '';
  if (project.opportunityOrigin || project.purpose || (project.certaintyItems && project.certaintyItems.length > 0) || (project.designSpaceItems && project.designSpaceItems.length > 0)) {
    framingSection = `
      <div class="page">
        <h2>Design Context</h2>
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
      </div>
    `;
  }
  
  // Exploration Lanes (each loop grouped, detailed)
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
  
  // Timeline Overview (condensed)
  let timelineSection = '';
  if (project.phaseHistory && project.phaseHistory.length > 0) {
    timelineSection = `
      <div class="page">
        <h2>Timeline Overview</h2>
        <div class="divider"></div>
        ${project.phaseHistory.map(event => `
          <div class="timeline-event">
            <p class="meta">${formatDate(event.timestamp)}</p>
            <p>Phase changed to <strong>${event.phase}</strong></p>
          </div>
        `).join('')}
      </div>
    `;
  }
  
  const content = coverPage + artifactsSection + framingSection + explorationSection + timelineSection;
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
  
  const totalHours = project.hours || 0;
  const totalCosts = project.costs || 0;
  
  // If no data, only show cover and overview
  if (totalHours === 0 && totalCosts === 0) {
    const content = coverPage + `
      <div class="page">
        <h2>Cost & Time Overview</h2>
        <div class="divider"></div>
        <p>No costs or hours have been recorded for this project.</p>
      </div>
    `;
    return getBaseHTML(`${project.title} - Costs & Hours Report`, content);
  }
  
  // Overview
  const overviewSection = `
    <div class="page">
      <h2>Cost & Time Overview</h2>
      <div class="divider"></div>
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
  
  // Breakdown by Exploration Loop
  let loopBreakdown = '';
  if (project.explorationLoops && project.explorationLoops.length > 0) {
    loopBreakdown = project.explorationLoops.map(loop => {
      const loopHours = loop.timeSpent || 0;
      const loopCosts = loop.costs || 0;
      
      if (loopHours === 0 && loopCosts === 0) {
        return ''; // Skip loops with no data
      }
      
      return `
        <div class="page">
          <h2>Loop: ${loop.question}</h2>
          <div class="divider"></div>
          <p class="meta">Status: ${loop.status} • Started: ${formatDate(loop.startDate)}</p>
          
          <h3>Summary</h3>
          <table class="cost-table">
            <tr>
              <th>Metric</th>
              <th>Amount</th>
            </tr>
            <tr>
              <td>Hours</td>
              <td>${loopHours.toFixed(1)} hours</td>
            </tr>
            <tr>
              <td>Costs</td>
              <td>$${loopCosts.toFixed(2)}</td>
            </tr>
          </table>
          
          <p class="meta" style="margin-top: 16px;">This report shows factual recorded data only. No projections or assumptions are included.</p>
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
