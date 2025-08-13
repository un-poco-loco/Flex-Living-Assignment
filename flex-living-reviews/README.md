# Property Reviews Dashboard

A React + TypeScript dashboard for viewing and managing property reviews, with analytics and insights.

## Tech Stack

- React (TypeScript)
- SWR (data fetching & caching)
- Tailwind CSS (UI styling)
- Lucide Icons (iconography)
- Node.js & npm (tooling)

## Features

- Property details and image gallery
- Review management (approve/unapprove for website)
- Analytics and insights (recurring issues, top strengths)
- Amenities and stats display
- Responsive design

## Getting Started

### Prerequisites

- Node.js (v18+)
- npm

### Installation

1. Clone the repository:
    ```sh
    git clone https://github.com/yourusername/property-reviews-dashboard.git
    cd property-reviews-dashboard
    ```

2. Install dependencies:
    ```sh
    npm install
    ```

3. Start the development server:
    ```sh
    npm run dev
    ```

4. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

- `app/property/[id]/page.tsx` — Property details page
- `app/dashboard/page.tsx` — Reviews dashboard
- `components/` — UI components
- `lib/hooks/` — Custom React hooks
- `public/images/` — Property images

## API Behaviors

- `/api/reviews/hostaway?propertyId=...` — Returns reviews for a property.
- `/api/properties/:id` — (To be implemented) Returns property details including images.

## Known Limitations

- Google Places API integration was not implemented due to:
    - Requirement for real property/place IDs
    - Need for billing setup
    - API key restrictions
- Currently using mock data for development purposes