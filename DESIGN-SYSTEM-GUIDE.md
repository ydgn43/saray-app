# Design System Guide - Consistent UI Across Pages

## 📋 Overview
This document outlines the consistent design patterns implemented across the Saray App to ensure a unified, mobile-first user experience.

## 🎨 Design Principles

### 1. **Mobile-First Approach**
- All components scale from mobile (320px) to desktop (1200px+)
- Use `clamp()` for responsive typography
- Hide non-essential labels on mobile with `d-none d-md-block`
- Reduce padding on mobile: `p-2` → `p-md-3`

### 2. **Spacing System**
- Container padding: `padding: '0 12px'`
- Card padding: `p-2 p-md-3` (8px mobile, 16px desktop)
- Margins: `mb-2` or `mb-3` (reduced from mb-4)
- Gap between elements: `gap-1 gap-md-2`

### 3. **Color Gradients**
Consistent gradient patterns for different page types:

```typescript
// Primary (Yoklama, Default)
'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'

// Students/Users
'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)'

// Statistics/Analytics  
'linear-gradient(135deg, #3494E6 0%, #EC6EAD 100%)'

// Success Actions
'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)'
```

## 📦 Reusable Components

### PageHeader Component
```tsx
import PageHeader from '../components/PageHeader';

<PageHeader 
  icon="📋"
  title="Günlük Yoklama"
  subtitle="Talebe yoklamalarını takip edin ve yönetin"
  gradient="linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
/>
```

**Features:**
- Responsive font sizing: `clamp(1.5rem, 5vw, 2rem)`
- Gradient text effect
- Subtitle hidden on mobile
- Smooth fade-in animation

## 🔘 Button Styles

### Primary Action Buttons
```tsx
style={{
  borderRadius: '8px',
  padding: '8px 16px',
  fontWeight: '600',
  fontSize: '0.85rem',
  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  border: 'none'
}}
```

### Small Buttons (btn-sm)
```tsx
className="btn btn-light btn-sm"
style={{
  borderRadius: '8px',
  padding: '6px 12px',
  fontWeight: '600',
  fontSize: '0.75rem'
}}
```

## 📝 Form Elements

### Input Fields
```tsx
className="form-control form-control-sm"
style={{
  borderRadius: '8px',
  border: 'none',
  padding: '8px 12px',
  fontSize: '0.85rem'
}}
```

### Select Dropdowns
```tsx
className="form-select form-select-sm"
style={{
  borderRadius: '8px',
  border: 'none',
  padding: '8px 12px',
  fontSize: '0.85rem'
}}
```

### Labels
```tsx
className="form-label text-white fw-bold mb-1 d-none d-md-block"
style={{ fontSize: '0.85rem' }}
```

## 🃏 Card Styles

### Filter/Control Cards
```tsx
<motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ delay: 0.1 }}
  className="card shadow border-0 mb-3"
  style={{
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    borderRadius: '12px'
  }}
>
  <div className="card-body p-2 p-md-3">
    {/* Content */}
  </div>
</motion.div>
```

## 🏷️ Badge Styles

### Count Badges
```tsx
<span 
  className="badge" 
  style={{
    background: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)',
    padding: '8px 16px',
    borderRadius: '20px',
    fontSize: '0.9rem',
    fontWeight: '700'
  }}
>
  Toplam: {count}
</span>
```

### Category Badges
```tsx
<span 
  className="badge" 
  style={{
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    padding: '6px 12px',
    borderRadius: '20px',
    fontSize: '0.8rem',
    fontWeight: '600'
  }}
>
  Category: {value}
</span>
```

## 📱 Responsive Grid

### Filter Row
```tsx
<div className="row g-2">
  <div className="col-12 col-md-6">
    {/* Search input */}
  </div>
  <div className="col-6 col-md-3">
    {/* Filter dropdown */}
  </div>
  <div className="col-6 col-md-3">
    {/* Another filter */}
  </div>
</div>
```

## ✨ Animation Patterns

### Page Entry
```tsx
<motion.div
  initial={{ opacity: 0, y: -20 }}
  animate={{ opacity: 1, y: 0 }}
  className="mb-3"
>
```

### Card Entry
```tsx
<motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ delay: 0.1 }}
>
```

### Button Actions
```tsx
<motion.button
  initial={{ opacity: 0, scale: 0.9 }}
  animate={{ opacity: 1, scale: 1 }}
  exit={{ opacity: 0, scale: 0.9 }}
>
```

## 📊 Page-Specific Patterns

### ✅ Attendance (Yoklama) Page
- **Header**: 📋 Günlük Yoklama
- **Gradient**: Purple (#667eea → #764ba2)
- **Date Navigation**: Compact arrows on mobile
- **Quick Actions**: "Bugün" button, calendar picker

### ✅ Students (Talebeler) Page  
- **Header**: 👥 Talebe Yönetimi
- **Gradient**: Pink (#f093fb → #f5576c)
- **Filters**: Search, Class, Season in one row
- **Actions**: ➕ Talebe Ekle, 📥 CSV İndir

### 🔄 Statistics (İstatistikler) Page (In Progress)
- **Header**: 📊 İstatistikler
- **Gradient**: Blue-Pink (#3494E6 → #EC6EAD)
- **Filters**: Date range, Program, Class level
- **Actions**: Export Excel/PDF

### 🔄 İzinli Talebeler Page (To Do)
- **Header**: 🏖️ İzinli Talebeler
- **Gradient**: Orange-Red gradient
- **Filters**: Date, Program, Search

## 🎯 Implementation Checklist

When updating a page to match the design system:

- [ ] Import `PageHeader` component
- [ ] Update container: `style={{ padding: '0 12px' }}`
- [ ] Replace header with `<PageHeader />` component
- [ ] Update filter card: gradient background, rounded corners
- [ ] Make all inputs `form-control-sm` with consistent styling
- [ ] Update buttons: `btn-sm`, rounded corners, gradient backgrounds
- [ ] Add responsive breakpoints: `col-12 col-md-*`
- [ ] Hide labels on mobile: `d-none d-md-block`
- [ ] Update badges: gradient backgrounds, pill shape
- [ ] Add `motion` animations for smooth entry
- [ ] Test on mobile (320px) and desktop (1200px+)

## 🚀 Benefits

- **Consistency**: All pages look and feel the same
- **Mobile-friendly**: Optimized for small screens
- **Performance**: Lighter, faster UI with less visual weight
- **Maintainability**: Shared components reduce code duplication
- **Accessibility**: Better touch targets, clear hierarchy
- **Modern**: Gradient effects, smooth animations

## 📝 Notes

- Always use `form-select-sm` and `form-control-sm` for compact UI
- Button text should be concise on mobile (use emojis when helpful)
- Maintain 8px/12px padding pattern (mobile/desktop)
- Keep border radius at 8px for buttons, 12px for cards
- Use `gap-1` on mobile, `gap-2` on desktop

---

**Last Updated**: October 22, 2025  
**Status**: ✅ Attendance page complete, ✅ Talebeler page complete, 🔄 Statistics in progress
