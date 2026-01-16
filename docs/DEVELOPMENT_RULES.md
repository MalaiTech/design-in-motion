
# Development Rules - Design in Motion

## PRODUCTION-ONLY ARCHITECTURE

This app is **production-only**. The following rules are permanent and non-negotiable.

### 🚫 NEVER CREATE

1. **Demo/Template Files**
   - No `app/modal.tsx`, `app/formsheet.tsx`, `app/transparent-modal.tsx`
   - No `components/DemoCard.tsx`, `components/homeData.ts`
   - No example/showcase/template screens

2. **Sample Data**
   - No placeholder projects
   - No example artifacts
   - No template decisions or framing content

3. **Demo Exports**
   - No example PDF exports
   - No sample export data
   - No template export formats

### ✅ ALWAYS FOLLOW

1. **Real Data Only**
   - All data from AsyncStorage
   - User-created projects only
   - No pre-populated content

2. **Empty State Handling**
   - Show empty states with helpful prompts
   - Never fill with demo/example data
   - Omit empty sections from exports

3. **Entry Point Immutability**
   - `app/(tabs)/(home)/index.tsx` always renders production Projects list
   - Never replace with demo/modal examples

### 🔒 LOCKED BEHAVIORS

#### Export Functionality
- Four production formats: Executive Overview, Design Process, Timeline, Costs & Hours
- All use real project data from AsyncStorage
- Empty sections are omitted entirely
- No placeholder text or sample exports

#### Home Screen
- Always shows user's real projects
- Filter/sort by phase
- Phase-colored cards with artifact strips
- No demo projects or template cards

#### Project Screens
- Framing, Exploration Loops, Timeline, Export
- All use real project data
- No example content or placeholder text

### 📋 PRE-COMMIT CHECKLIST

Before any code change, verify:

- [ ] No demo/template files created
- [ ] No sample data added
- [ ] Entry point renders production Projects list
- [ ] Export functionality uses real data only
- [ ] Empty sections handled gracefully (omitted, not filled)
- [ ] No placeholder text or example content

### 🛡️ ENFORCEMENT

These rules apply to:
- New features
- Bug fixes
- Refactoring
- Documentation
- All future development

**Violations must be rejected immediately.**

---

**Status:** LOCKED - These rules are permanent
