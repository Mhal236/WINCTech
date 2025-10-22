# Glass Order Demo Mode - Setup Guide

## Overview
A demonstration mode has been implemented for stakeholder presentations on the glass-order page.

## Demo Vehicle Details

**VRN:** `HN11EYW`

When searching for this VRN on the glass-order page, the system will automatically:
- Display vehicle details: **2011 Audi A3 2.0 TDI Diesel Manual**
- Show multiple glass options available for this vehicle

### Available Glass Options for HN11EYW:

1. **Windscreen** - ARGIC: `2448ACCGNMV1B`
   - Rain Sensor badge ✓
   - Description: "Windscreen - Rain Sensor - Acoustic Laminated Glass"
   - Price: £285.50
   - Stock: 5 units

2. **Right Body Glass** - ARGIC: `2448RGDH5RD`
   - Description: "Right Body Glass - Door Glass"
   - Price: £95.00
   - Stock: 3 units

3. **Left Body Glass** - ARGIC: `2448LGDH5RD`
   - Description: "Left Body Glass - Door Glass"
   - Price: £95.00
   - Stock: 3 units

4. **Rear Screen (Backlight)** - ARGIC: `2448BGDHAB1F`
   - Description: "Rear Screen - Backlight - Heated Glass"
   - Price: £165.00
   - Stock: 2 units

## Features Implemented

### 1. Demo Data in API Server (`api-server.js`)
- Hardcoded response for VRN `HN11EYW`
- Returns complete vehicle and glass data without requiring external API calls
- Glass option includes sensor detection flags

### 2. Auto-Detection of Windscreen Features (`src/pages/PriceLookup.tsx`)
- Automatically scans glass options for feature keywords:
  - **Rain Sensor**: Detects "rain sensor", "sensor", "rs", or `hasSensor: true`
  - **Heated Screen**: Detects "heated", "heat", "hrf"
  - **ADAS**: Detects "adas", "advanced", "assist"
  - **HUD**: Detects "hud", "head up", "heads up"

- When detected, feature badges are automatically displayed in the vehicle info card
- The windscreen selection is also auto-updated with the detected sensor feature

### 3. ARGIC Code Display
- Prominently displayed as a cyan badge in the vehicle information card
- Format: "ARGIC: 2448ACCGNMV1B"
- Visible when vehicle data is loaded

### 4. Credit Deduction (10 Credits)
- Every VRN lookup on glass-order now deducts **10 credits**
- Credits are checked before the lookup
- If insufficient credits, user is notified and lookup is prevented
- Transaction is recorded in `credit_transactions` table
- User credit balance is automatically refreshed after deduction

### 5. Toast Notification Update
- Removed ARGIC code from the success notification
- Now shows generic "Vehicle data loaded successfully" message
- No more bottom-right toast showing the ARGIC code
- Removed "API Server Error" and "API Connection Issue" notifications for cleaner demo experience
- Removed all availability warning toast notifications:
  - "Availability Warning"
  - "Limited Availability"
  - "Multiple Locations Available"
  - "Error Checking Availability"
- Availability checks still run in background but don't interrupt user experience

### 6. Simplified Glass Type Selection with Branded Loading
- Dropdown now only shows 4 relevant glass types:
  - **Windscreen** (set as default)
  - **Right Body Glass**
  - **Left Body Glass**
  - **Rear Screen (Backlight)**
- Removed all other glass type options for cleaner demo experience
- **ARGIC code automatically updates** when you switch glass types:
  - Selecting "Windscreen" → Shows `2448ACCGNMV1B`
  - Selecting "Right Body Glass" → Shows `2448RGDH5RD`
  - Selecting "Left Body Glass" → Shows `2448LGDH5RD`
  - Selecting "Rear Screen" → Shows `2448BGDHAB1F`
- **Search button behavior:**
  - Disabled until vehicle data is loaded
  - Disabled during loading (cannot click while searching)
  - Shows spinner in button when loading
- **WindscreenCompare branded loading animation** displays ONLY when clicking Search button:
  - Large spinning ring (1.5s rotation) with WINC.png logo in center
  - WINC logo pulses while loading
  - "WindscreenCompare" brand name displayed prominently
  - "Searching for glass options..." message with pulse effect
  - "Finding the best prices from our suppliers" subtitle
  - Three animated bouncing dots at bottom with staggered timing
  - Cyan (#0FB8C1) brand color throughout
  - Card has matching teal border (border-2 border-[#0FB8C1])
  - **Guaranteed 3-second display duration** - animation shows for exactly 3 seconds minimum
  - Previous results are cleared before new search
  - Does NOT appear when initially entering VRN (only quick toast notification)
- **Results table styling:**
  - Same teal border as loading screen (border-2 border-[#0FB8C1])
  - Matching shadow-lg for consistency
  - Creates cohesive branded experience
- Sensor badges (Rain Sensor) only display for Windscreen type

## How to Use for Demo

### Initial Search:
1. Navigate to **Glass Order** page
2. Depot defaults to **Enfield (ENF)** - or select a different depot from the dropdown
3. Enter VRN: `HN11EYW` (press Enter)
4. System will:
   - Deduct 10 credits (one-time)
   - Show quick toast: "Vehicle data loaded successfully"
   - Enable the Search button
5. **Click the Search button** (yellow button)
6. **3-second branded loading animation appears** with WINC logo
7. Results display showing:
   - ARGIC code: `2448ACCGNMV1B` (Windscreen - default)
   - "Rain Sensor" badge
   - Pricing and stock information

### Switching Glass Types:
8. Select different glass type from dropdown (e.g., "Right Body Glass")
9. Search results **disappear** (reset)
10. ARGIC badge **stays the same** (shows previous search ARGIC)
11. **Click Search button again**
12. **3-second loading animation displays**
13. New results appear with updated ARGIC: `2448RGDH5RD`

### Try All Glass Types:
- **Windscreen**: Click Search → Shows `2448ACCGNMV1B` + Rain Sensor badge
- **Right Body Glass**: Click Search → Shows `2448RGDH5RD`
- **Left Body Glass**: Click Search → Shows `2448LGDH5RD`
- **Rear Screen**: Click Search → Shows `2448BGDHAB1F`

Each change requires clicking the Search button to trigger the 3-second branded loading animation!

## Delivery & Collection Addresses

For the checkout process:

### Delivery Option
- Displays: **(Branch of your choice)**
- Indicates flexible delivery to any branch location

### Collection Address
**Pugh's Enfield Depot:**
- Unit 1, 69 Millmarsh Lane, Enfield EN3 7UY
- Phone: 0

The delivery option shows flexibility while collection shows the specific Enfield depot address.

## Available Depot Locations

The depot dropdown now includes locations from both suppliers (Charles Pugh's appears first).

**Default Selection:** Enfield (ENF) is pre-selected when you load the page.

### Charles Pugh's
- Bristol - BRS
- Dartford - DAR
- **Enfield - ENF** (Default)
- Leeds - LDS
- Wednesbury - WED

### Master Auto Glass
- Park Royal (London) - PAR
- Walthamstow (London) - WAL
- Maidstone - ROC
- Cambridge - CMB
- Birmingham - BIR
- Manchester - MAN
- Nottingham - NOT
- Durham - DUR
- Glasgow - GLA
- Plate Glass - PLT

## Postcode Filter Feature

A new postcode search feature has been added to help filter depots by proximity:

### How to Use:
1. Enter your UK postcode in the "Your Postcode" field (e.g., SW1A 1AA)
2. Press Enter or click the search button
3. The system will:
   - Find all depots within 50 miles of your location
   - Sort them by distance (nearest first)
   - Display the distance to each depot
   - Update the depot dropdown to show only nearby locations

### Features:
- **50-mile radius**: Searches within a 50-mile radius of your postcode
- **Distance display**: Shows exact distance in miles for each depot
- **Sorted by proximity**: Nearest depots appear first
- **Automatic filtering**: Depot dropdown updates to show only nearby locations
- **Reset function**: Clear the postcode to see all depots again

## Technical Details

### API Response Structure
```javascript
{
  success: true,
  data: {
    make: "AUDI",
    model: "A3",
    year: "2011",
    argicCode: "2448ACCGNMV1B",
    shortArgicCode: "2448",
    glassOptions: [
      {
        fullCode: "2448ACCGNMV1B",
        shortCode: "2448",
        description: "Windscreen - Rain Sensor - Acoustic Laminated Glass",
        price: 285.50,
        qty: 5,
        hasSensor: true,
        hasCamera: false,
        isAcoustic: true,
        features: { sensor: true, camera: false, acoustic: true }
      },
      {
        fullCode: "2448RGDH5RD",
        shortCode: "2448",
        description: "Right Body Glass - Door Glass",
        price: 95.00,
        qty: 3,
        hasSensor: false,
        hasCamera: false,
        features: { sensor: false }
      },
      {
        fullCode: "2448LGDH5RD",
        shortCode: "2448",
        description: "Left Body Glass - Door Glass",
        price: 95.00,
        qty: 3,
        hasSensor: false,
        hasCamera: false,
        features: { sensor: false }
      },
      {
        fullCode: "2448BGDHAB1F",
        shortCode: "2448",
        description: "Rear Screen - Backlight - Heated Glass",
        price: 165.00,
        qty: 2,
        hasSensor: false,
        hasCamera: false,
        isHeated: true,
        features: { sensor: false, heated: true }
      }
    ]
  },
  isDemo: true
}
```

### Credit Transaction
- **Amount**: 10 credits
- **Type**: Deduction
- **Description**: "VRN lookup for HN11EYW on glass-order"
- **Logged**: Yes, in `credit_transactions` table

## Notes for Stakeholders

- This demonstration shows the real-time glass ordering workflow
- The sensor detection is automatic and works with real API data too
- ARGIC codes are industry-standard glass identification codes
- Credit system ensures proper usage tracking
- All features shown in demo work with real vehicle data from the MAG API

## Glass Order System

### Order Confirmation Page
When a glass order payment succeeds:
- User is redirected to a clean, professional order confirmation page
- Displays:
  - Green bouncing checkmark icon
  - "Order Confirmed!" heading
  - Unique order number (e.g., WC-2025-ABC123XYZ)
  - Order date and time
  - Vehicle details
  - All ordered items with pricing breakdown
  - Delivery/Collection address
  - Order summary (Subtotal, VAT, Delivery Fee, Total)
  - Payment success confirmation
  - "What happens next?" section with 4 steps
  - Action buttons to view history or place another order
  - Support contact information

### History Page - Glass Orders Tab
- New **"Glass Orders"** tab (positioned at the end)
- **"All" tab removed** from History page
- Default view: **Completed jobs**
- Tab order:
  1. Completed
  2. Cancelled
  3. Leads
  4. **Glass Orders** (new!)
- Glass Orders section shows:
  - Order number with status badge
  - Vehicle information
  - Order date and time
  - Total amount (large, bold)
  - All items with part numbers
  - Delivery/Collection info
  - "View Details" button → opens order confirmation page
- Empty state encourages users to place first order

### Database
- New `glass_orders` table created
- Stores all order details, payment info, and status
- Full RLS enabled for security
- Indexed for fast queries

## Cleanup

To remove demo mode later, simply delete or comment out the demo check in `api-server.js` (lines 294-333).

