
# Export Policy - Production Only

## CRITICAL RULE: NO DEMO EXPORTS

This document establishes the permanent policy for export functionality in Design in Motion.

### STRICT REQUIREMENTS

1. **NO DEMO EXPORTS**
   - Never generate example/demo/placeholder PDF exports
   - Never create sample export data
   - Never add template export screens

2. **REAL DATA ONLY**
   - All exports must use actual project data from AsyncStorage
   - If data is missing, omit the section entirely
   - Never insert placeholder text like "Sample Project" or "Example Decision"

3. **PRODUCTION SCREENS ONLY**
   - Export screen (`app/(tabs)/(home)/export.tsx`) is production-only
   - No demo routes or example export flows
   - No showcase/template export formats

4. **EMPTY DATA HANDLING**
   - If a section has no content, silently omit it from the PDF
   - Do not show "No data available" or placeholder messages
   - Example: If no costs recorded, omit the costs section entirely

### EXPORT FORMATS (PRODUCTION)

The app supports four export formats, all using real project data:

1. **Executive Overview** - Decision-focused summary
2. **Design Process Report** - Full narrative with framing and exploration
3. **Timeline** - Chronological project events
4. **Costs & Hours Report** - Analytical breakdown of recorded time/costs

### IMPLEMENTATION FILES

- `app/(tabs)/(home)/export.tsx` - Export screen (production only)
- `app/(tabs)/(home)/export.ios.tsx` - iOS-specific export screen
- `utils/pdfExport.ts` - PDF generation logic (real data only)

### VALIDATION CHECKLIST

Before any export-related changes, confirm:

- [ ] No demo/example/placeholder content added
- [ ] No sample projects or template data created
- [ ] Export screen remains production-only
- [ ] All data comes from AsyncStorage
- [ ] Empty sections are omitted, not filled with placeholders
- [ ] No new demo routes or showcase files

### ENFORCEMENT

This policy is **NON-NEGOTIABLE** and applies to:
- All future feature additions
- Bug fixes and improvements
- Refactoring and optimization
- Documentation and examples

Any code review or change request that violates this policy must be rejected.

---

**Last Updated:** 2025-01-XX
**Status:** LOCKED - Do not modify this policy
