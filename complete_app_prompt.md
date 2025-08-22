### Server-Side AI Model Considerations
The AI model should be specifically instructed about body part significance:

```javascript
// Body part significance for diagnosis:
// hands + feet + mouth = strongly suggests HFMD
// hands only = contact dermatitis, atopic dermatitis flare  
// feet only = contact dermatitis (shoes), fungal infection
// head/face = impetigo, viral exanthems, fifth_disease
// chest/abdomen = viral rashes, drug eruptions
// back/hips = viral rashes, drug eruptions
// throat/nape = viral pharyngitis with rash
// arms/legs = generalized viral rashes, drug eruptions
```

### Body Part Validation
Server-side validation should include:
```javascript
const validBodyParts = ['head', 'throat', 'nape', 'chest', 'abdomen', 'back', 'hips', 'arms', 'hands', 'legs', 'feet'];
```### SVG Body Diagram Implementation
```html
<!-- Front View -->
<svg class="body-diagram" viewBox="0 0 250 500">
  <!-- Head -->
  <path class="body-part" data-part="head" d="M125,10 C100,10 80,30 80,55 C80,80 100,100 125,100 C150,100 170,80 170,55 C170,30 150,10 125,10 Z"/>
  <!-- Throat -->
  <path class="body-part" data-part="throat" d="M110,100 L140,100 L140,120 L110,120 Z"/>
  <!-- Chest -->
  <path class="body-part" data-part="chest" d="M90,120 L160,120 L170,190 L80,190 Z"/>
  <!-- Abdomen -->
  <path class="body-part" data-part="abdomen" d="M85,190 L165,190 L160,250 L90,250 Z"/>
  <!-- Left Arm -->
  <path class="body-part" data-part="arms" d="M80,125 L60,130 L50,230 L75,225 Z"/>
  <!-- Right Arm -->
  <path class="body-part" data-part="arms" d="M170,125 L190,130 L200,230 L175,225 Z"/>
  <!-- Left Hand -->
  <path class="body-part" data-part="hands" d="M50,230 C40,230 35,240 45,250 C55,260 60,250 50,230 Z"/>
  <!-- Right Hand -->
  <path class="body-part" data-part="hands" d="M200,230 C210,230 215,240 205,250 C195,260 190,250 200,230 Z"/>
  <!-- Hips (front) -->
  <path class="body-part" data-part="hips" d="M90,250 L160,250 L155,280 L95,280 Z" />
  <!-- Left Leg -->
  <path class="body-part" data-part="legs" d="M95,280 L85,450 L115,450 L110,280 Z"/>
  <!-- Right Leg -->
  <path class="body-part" data-part="legs" d="M155,280 L165,450 L135,450 L140,280 Z"/>
  <!-- Left Foot -->
  <path class="body-part" data-part="feet" d="M85,450 L75,455 L95,465 L115,450 Z"/>
  <!-- Right Foot -->
  <path class="body-part" data-part="feet" d="M165,450 L175,455 L155,465 L135,450 Z"/>
</svg>

<!-- Back View -->
<svg class="body-diagram" viewBox="0 0 250 500">
  <!-- Head -->
  <path class="body-part" data-part="head" d="M125,10 C100,10 80,30 80,55 C80,80 100,100 125,100 C150,100 170,80 170,55 C170,30 150,10 125,10 Z"/>
  <!-- Nape -->
  <path class="body-part" data-part="nape" d="M110,100 L140,100 L140,120 L110,120 Z"/>
  <!-- Back -->
  <path class="body-part" data-part="back" d="M90,120 L160,120 L165,250 L85,250 Z"/>
  <!-- Left Arm -->
  <path class="body-part" data-part="arms" d="M80,125 L60,130 L50,230 L75,225 Z"/>
  <!-- Right Arm -->
  <path class="body-part" data-part="arms" d="M170,125 L190,130 L200,230 L175,225 Z"/>
  <!-- Left Hand -->
  <path class="body-part" data-part="hands" d="M50,230 C40,230 35,240 45,250 C55,260 60,250 50,230 Z"/>
  <!-- Right Hand -->
  <path class="body-part" data-part="hands" d="M200,230 C210,230 215,240 205,250 C195,260 190,250 200,230 Z"/>
  <!-- Hips (back) -->
  <path class="body-part" data-part="hips" d="M90,250 L160,250 L155,280 L95,280 Z" />
  <!-- Left Leg -->
  <path class="body-part" data-part="legs" d="M95,280 L85,450 L115,450 L110,280 Z"/>
  <!-- Right Leg -->
  <path class="body-part" data-part="legs" d="M155,280 L165,450 L135,450 L140,280 Z"/>
  <!-- Left Foot -->
  <path class="body-part" data-part="feet" d="M85,450 L75,455 L95,465 L115,450 Z"/>
  <!-- Right Foot -->
  <path class="body-part" data-part="feet" d="M165,450 L175,455 L155,465 L135,450 Z"/>
</svg>
```# Complete Prompt: Pediatric Rash Analysis Application

Create a comprehensive web application for pediatric rash analysis using AI image recognition. The application should allow healthcare professionals to upload rash images and get automated triage suggestions based on visual analysis and patient context data.

## Technical Stack & Architecture

### Backend (Node.js/Express)
- **Framework**: Express.js with ES6 modules
- **AI Integration**: Google Gemini API (1.5-flash model) with structured JSON output
- **File Handling**: Multer for image uploads (max 5MB, JPEG/PNG only)
- **Environment**: dotenv for configuration
- **CORS**: Enabled for cross-origin requests

### Frontend
- **Vanilla JavaScript** (no frameworks)
- **Chart.js** for data visualization
- **Modern CSS** with CSS Grid and Flexbox
- **Responsive design** for mobile and desktop
- **Dark theme** with glassmorphism effects

## Core Features & Functionality

### 1. Image Upload System
- **Drag & drop** interface with visual feedback
- **File validation**: Image types only, 5MB limit
- **Preview** functionality before analysis
- **Error handling** with user-friendly messages

### 2. Patient Information Collection
- **Age input**: Years (0-18) and months (0-11) with validation
- **Biological sex**: Male/Female dropdown
- **Real-time form validation** with error messages
- **Input sanitization** and bounds checking

### 3. Temperature Management
- **Dual unit support**: Celsius/Fahrenheit with instant conversion
- **Interactive slider** with color-coded temperature ranges:
  - Green: Normal (36.1-37.2°C / 97-99°F)
  - Yellow: Slightly elevated (37.2-38°C / 99-100.4°F)
  - Red: Fever (≥38°C / ≥100.4°F)
- **Synchronized input**: Slider and text input stay in sync
- **Status display**: Shows temperature category with visual indicators

### 4. Interactive Body Diagram
- **Dual view**: Front and back body diagrams using SVG
- **Clickable regions**: Head, throat/nape, chest, abdomen/back, arms, hands, legs, feet, hips
- **Visual feedback**: Hover effects and selection highlighting
- **Multi-selection**: Click to toggle, supports multiple body parts
- **Reset functionality**: Clear all selections with one button
- **Real-time display**: Shows selected areas as comma-separated list

Body parts mapping:
- Front: head, throat, chest, abdomen, arms, hands, legs, feet
- Back: head, nape, back, hips, arms, hands, legs, feet

### 5. Medical History Collection
- **Medication tracking**: Free text input for recent medications
- **Antibiotic flag**: Checkbox for antibiotic use
- **Vaccination history**: Measles and chickenpox (single row layout)
- **General condition**: Dropdown with options:
  - Playing normally
  - Lethargic/tired
  - Difficult to wake up

### 6. Symptom Assessment
- **Checkbox grid** (2 columns, responsive to 1 column on mobile):
  - Sore throat
  - Cough
  - Vomiting
  - Diarrhea
  - Shortness of breath
- **Custom checkbox styling** with checkmark animations

### 7. AI Analysis Integration
- **Gemini API integration** with structured JSON schema
- **Patient context compilation**: All form data converted to standardized format
- **Error handling**: Retry logic with exponential backoff
- **Response validation**: JSON schema enforcement

### 8. Results Display System
- **Input data visualization**: Shows exact JSON sent to API
- **Triage color coding**:
  - 🟢 Green: Low risk
  - 🟡 Yellow: Moderate risk
  - 🟠 Yellow/Red: High risk
  - 🔴 Red: Emergency risk
- **Interactive bar chart**: Match scores for different conditions
- **Red flag alerts**: Prominent warnings for urgent cases
- **Image quality warnings**: Alerts for poor image quality

### 9. Data Management
- **Real-time clearing**: Previous results cleared on new submission
- **Console logging**: Debug information for developers
- **Form persistence**: Values maintained during session
- **Validation feedback**: Real-time error messages

## AI Model Configuration

### Allowed Conditions (Exact Labels)
```javascript
const ALLOWED_LABELS = [
  "diaper_dermatitis",     // Green triage
  "atopic_dermatitis",     // Green triage
  "viral_rash",            // Yellow triage
  "urticaria",             // Yellow triage
  "drug_eruption",         // Yellow/Red triage
  "varicella",             // Red triage (Chickenpox)
  "measles",               // Red triage
  "rubella",               // Yellow triage
  "fifth_disease",         // Yellow triage
  "roseola",               // Yellow triage
  "hfmd",                  // Yellow triage (Hand-Foot-Mouth)
  "impetigo",              // Yellow triage
  "cellulitis",            // Yellow triage
  "meningococcemia"        // Red triage
];
```

### JSON Response Schema
```javascript
{
  "labels": [
    { "name": "condition_name", "match": 0.0-1.0 }
  ],
  "top": "highest_scoring_condition",
  "confidence": 0.0-1.0,
  "triage_level": "Green|Yellow|Yellow/Red|Red",
  "red_flags": ["flag1", "flag2"],
  "image_quality_warning": "string or null",
  "disclaimer": "standard_disclaimer_text"
}
```

### Patient Context Schema
```javascript
{
  "age_months": "number (0-216)",
  "biological_sex": "M|F",
  "temperature_celsius": "number (32-45)",
  "fever_present": "boolean",
  "rash_distribution": ["head", "throat", "nape", "chest", "abdomen", "back", "hips", "arms", "hands", "legs", "feet"],
  "recent_medication": "string",
  "antibiotic_use": "boolean",
  "measles_vaccine": "boolean",
  "chickenpox_vaccine": "boolean",
  "general_condition": "playing|lethargic|difficult_to_wake",
  "accompanying_symptoms": ["symptom_array"]
}
```

## UI/UX Design Specifications

### Color Scheme (CSS Variables)
```css
:root {
  --bg: #0b0f19;           /* Main background */
  --card: #121826;         /* Card backgrounds */
  --muted: #9aa4b2;        /* Secondary text */
  --text: #e5e7eb;         /* Primary text */
  --accent: #7dd3fc;       /* Accent color */
  --danger: #ef4444;       /* Error/warning */
  --ok: #22c55e;           /* Success */
  --radius: 16px;          /* Border radius */
}
```

### Layout Structure
- **Header**: Centered branding with tagline
- **Two-column grid**: Form (left) and results (right)
- **Responsive breakpoint**: Single column on mobile (<900px)
- **Card-based design**: Glassmorphism effects with backdrop blur
- **Consistent spacing**: 16px grid system

### Interactive Elements
- **Buttons**: Gradient backgrounds with disabled states
- **Form inputs**: Subtle borders with focus states
- **Checkboxes**: Custom styled with checkmark animations
- **Sliders**: Color-coded backgrounds with custom thumbs
- **SVG diagrams**: Hover and selection state styling

## Error Handling & Validation

### Client-Side Validation
- **Age validation**: 0-18 years, 0-11 months, max 18 years total
- **Temperature validation**: Celsius (32-45°C), Fahrenheit (90-113°F)
- **File validation**: Image types only, 5MB maximum
- **Real-time feedback**: Immediate error display

### Server-Side Validation
- **Image validation**: MIME type checking
- **Context validation**: Schema validation for all patient data
- **API error handling**: Retry logic with backoff
- **Response validation**: JSON schema enforcement

### User Feedback
- **Loading states**: "Analyzing..." with disabled controls
- **Error messages**: Specific, actionable error text
- **Success indicators**: Visual confirmation of successful operations
- **Warning badges**: Prominent display for critical information

## File Structure

```
project/
├── package.json           # Dependencies and scripts
├── server.mjs            # Express server with Gemini integration
├── .env                  # Environment variables
├── README.md             # Setup instructions
└── public/
    ├── index.html        # Main HTML structure
    └── app.js           # Frontend JavaScript logic
```

## Environment Configuration

### Required Environment Variables
```bash
GEMINI_API_KEY=your_gemini_api_key_here
GEMINI_MODEL=gemini-1.5-flash  # Optional, defaults to this
PORT=3000                      # Optional, defaults to 3000
```

### Package Dependencies
```json
{
  "dependencies": {
    "@google/generative-ai": "^0.21.0",
    "cors": "^2.8.5",
    "dotenv": "^16.4.5",
    "express": "^4.19.2",
    "multer": "^1.4.5-lts.1"
  }
}
```

## API Endpoints

### POST /api/analyze
- **Purpose**: Main analysis endpoint
- **Input**: FormData with image file and patient_context JSON
- **Output**: Structured analysis results
- **Error handling**: Comprehensive error responses

### GET /api/debug
- **Purpose**: Server health check
- **Output**: Server status and API key presence (masked)

### POST /api/ping
- **Purpose**: Gemini API connectivity test
- **Output**: Simple JSON response validation

## Security & Privacy

### Data Handling
- **No image storage**: Images processed in memory only
- **Anonymized metadata**: Only non-identifying data may be retained
- **Input sanitization**: All user inputs validated and sanitized
- **Error masking**: Sensitive error details hidden from client

### API Security
- **CORS configuration**: Appropriate origin restrictions
- **File size limits**: Prevent DoS attacks
- **Rate limiting**: Should be implemented for production
- **Input validation**: Schema validation on all inputs

## Deployment Considerations

### Production Checklist
- [ ] Environment variables properly configured
- [ ] HTTPS enabled for secure image uploads
- [ ] Rate limiting implemented
- [ ] Error logging configured
- [ ] Health monitoring setup
- [ ] API key rotation strategy
- [ ] Backup and recovery procedures

### Performance Optimization
- **Image compression**: Client-side resizing before upload
- **Caching**: Appropriate cache headers for static assets
- **CDN**: Chart.js served from CDN
- **Lazy loading**: Deferred script loading
- **Minification**: CSS and JS optimization for production

## Medical Disclaimers

### Required Legal Text
"This output is not a medical diagnosis or treatment advice. No patient images are stored by this system; only anonymized metadata may be retained. If any red flags are returned, please contact your doctor or seek urgent care immediately."

### UI Placement
- **Prominent display**: Always visible disclaimer
- **Red flag alerts**: Urgent care warnings
- **Clear labeling**: "Not Medical Advice" in branding

This prompt provides a complete specification for recreating the pediatric rash analysis application with all features, technical requirements, and implementation details.