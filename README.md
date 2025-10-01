# BWN Airport Flight Tracker

A modern, Apple-style web application for tracking flight departures and arrivals at Brunei International Airport (BWN). Built with Next.js, TypeScript, and Tailwind CSS, featuring real-time flight data from FlightAware API.

## ✈️ Features

- **Real-time Flight Data**: Live departures and arrivals from BWN airport
- **Date Selection**: Calendar picker for viewing flights on any date (past 30 days to future)
- **Apple-style UI**: Clean, modern interface with smooth animations
- **Responsive Design**: Works perfectly on desktop and mobile devices
- **Flight Details**: Comprehensive flight information including:
  - Flight number and airline
  - Origin and destination airports
  - Scheduled, estimated, and actual times
  - Flight status and delays
  - Gate information
  - Aircraft type and route distance

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd flightdata
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the development server**
   ```bash
   npm run dev
   ```

4. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 🛠️ Technical Stack

- **Framework**: Next.js 15.5.4 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **API**: FlightAware AeroAPI
- **Deployment**: Vercel-ready

## 📁 Project Structure

```
src/
├── app/
│   ├── api/
│   │   ├── departures/route.ts    # Departures API endpoint
│   │   └── arrivals/route.ts      # Arrivals API endpoint
│   ├── globals.css                # Global styles
│   ├── layout.tsx                 # Root layout
│   └── page.tsx                   # Main page
├── components/
│   ├── Calendar.tsx               # Date picker component
│   ├── FlightCard.tsx            # Individual flight display
│   └── FlightList.tsx            # Flight list container
└── lib/
    └── flightaware.ts            # API integration & utilities
```

## 🔧 Configuration

### API Key
The application uses a pre-configured FlightAware API key. For production use, consider:
- Moving the API key to environment variables
- Implementing proper API key management
- Adding rate limiting and error handling

### Airport Code
Currently configured for **BWN** (Brunei International Airport). To change:
1. Update `src/lib/flightaware.ts`
2. Modify API calls in `src/app/api/` routes
3. Update UI text in `src/app/page.tsx`

## 📱 Usage

### Viewing Flights
1. **Select a date** using the calendar picker
2. **Choose tab** between Departures and Arrivals
3. **Browse flights** with real-time status updates

### Date Selection
- **Past dates**: Up to 30 days ago
- **Future dates**: Any future date (limited data availability)
- **Today**: Current day flights

### Flight Information
Each flight card displays:
- **Flight Number**: IATA/ICAO codes
- **Aircraft**: Type and registration
- **Times**: Scheduled, estimated, actual
- **Status**: On-time, delayed, cancelled, etc.
- **Route**: Origin and destination airports
- **Details**: Gate, terminal, baggage claim

## 🚨 Troubleshooting

### No Flights Showing
- **Check date**: Try recent past dates for better data availability
- **Console logs**: Check browser console for API errors
- **API limits**: FlightAware may have limited data for future dates

### Common Issues
- **Timezone problems**: Fixed with local date formatting
- **API timeouts**: Increased to 15 seconds with fallback endpoints
- **Missing data**: Graceful handling of incomplete flight information

## 🔄 API Integration

### FlightAware AeroAPI
- **Endpoint**: `https://aeroapi.flightaware.com/aeroapi`
- **Authentication**: API key in headers
- **Rate Limits**: 10,000 requests/month (free tier)
- **Data Types**: Departures, arrivals, flight details

### Fallback Strategy
- **Primary**: `/airports/{airport}/flights/departures|arrivals`
- **Fallback**: `/airports/{airport}/flights` (general endpoint)
- **Error Handling**: Graceful degradation with user feedback

## 🎨 UI/UX Features

### Apple-style Design
- **Typography**: San Francisco font family
- **Colors**: Clean grays and blues
- **Spacing**: Generous padding and margins
- **Animations**: Smooth transitions and hover effects

### Responsive Layout
- **Mobile-first**: Optimized for all screen sizes
- **Touch-friendly**: Large tap targets
- **Accessible**: Proper contrast and focus states

## 🚀 Deployment

### Vercel (Recommended)
1. **Connect repository** to Vercel
2. **Deploy automatically** on push to main
3. **Environment variables** for API keys

### Other Platforms
- **Netlify**: Static site generation
- **Railway**: Full-stack deployment
- **Docker**: Containerized deployment

## 📊 Performance

- **Fast loading**: Optimized images and code splitting
- **Efficient API calls**: Cached responses and error handling
- **Smooth interactions**: 60fps animations and transitions

## 🔒 Security

- **API key protection**: Server-side API calls only
- **Input validation**: Sanitized date and airport inputs
- **Error handling**: No sensitive data exposure

## 📈 Future Enhancements

- **Real-time updates**: WebSocket integration
- **Flight tracking**: Live position updates
- **Notifications**: Flight status alerts
- **Multi-airport**: Support for multiple airports
- **Offline support**: PWA capabilities

## 🤝 Contributing

1. **Fork the repository**
2. **Create feature branch**: `git checkout -b feature/amazing-feature`
3. **Commit changes**: `git commit -m 'Add amazing feature'`
4. **Push to branch**: `git push origin feature/amazing-feature`
5. **Open Pull Request**

## 📄 License

This project is licensed under the ISC License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **FlightAware** for providing flight data API
- **Next.js team** for the amazing framework
- **Tailwind CSS** for the utility-first CSS framework
- **Vercel** for seamless deployment

---

**Built with ❤️ for Brunei International Airport travelers**