# Campus RideShare Platform
A student-built ride-sharing platform designed for quick, flexible, and affordable rides around campus. This project was originally created for a hackathon/codathon and placed **3rd overall**. It uses **Supabase** as the backend and integrates AI-assisted development throughout the build.
---

## 🚀 Overview
The platform lets students request rides, set their own price, choose flexible payment types, and match with student drivers. Riders get control, drivers get options — and the whole system stays within the campus community.

---

## 🎯 Key Features
### 🧑‍🤝‍🧑 For Riders
- Create a ride request with:
  - Pickup + drop-off locations  
  - A custom price  
  - Optional notes  
- Choose how to “pay”:  
  - **Dining dollars**  
  - **Cash**  
  - **Meal swipes**  
  - **Free**  
- Browse available drivers and choose who you want

### 🚗 For Drivers
- View all open ride requests  
- Filter requests by location, price, or time  
- Choose the rider you want to pick up  
- Mark rides as accepted and completed

### 🔐 Student-Only Access
- Authentication powered by **Supabase Auth**
- Keeps the platform secure and campus-exclusive

---

## 🛠️ Tech Stack

### Backend / Database
- **Supabase** (authentication, real-time database, storage)
- Postgres schema for:
  - Users  
  - Ride requests  
  - Driver responses  
  - Payment type selection  

### Frontend
- Modern JavaScript/TypeScript framework (React/Next.js — or specify if different)
- TailwindCSS or other styling tools (tell me if you want this added)

### AI-Assisted Development
Many components, helper functions, and backend logic were built with AI assistance for rapid prototyping during the hackathon.

---

## 🧩 How It Works

1. **Student signs in** with their campus email  
2. **Rider creates a request** (pickup, drop-off, price, payment type)  
3. The request is stored in **Supabase** and appears for all drivers  
4. **Drivers browse** and choose a request  
5. The rider sees all incoming offers and picks the driver they want  
6. After the ride, the driver marks it **Completed**  
7. System tracks request history, status, and analytics

---

## 🎖️ Hackathon Result
This project was submitted during a university codathon/hackathon and earned **3rd place**, recognized for:
- creative use of Supabase  
- real student utility  
- smooth UI and simple interaction flow  

---

## 🤝 Contributions
This project was built primarily for a student hackathon, but it's designed to be extended — better routing, map integration, real payments, etc.
If you’d like a **Future Improvements** section or **Architecture Diagram**, say the word.

---

## 📄 License

