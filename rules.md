# 📏 Engineering Rules for Happenin

## 1. Never Trust the Client
- All ticket validation MUST happen on backend
- QR codes should be signed & time-bound

---

## 2. Real-time ≠ Spam Updates
- Debounce crowd updates (avoid flooding WebSockets)
- Batch updates instead of firing per event

---

## 3. Database is Your Backbone
- Always use indexes for:
  - location queries
  - event filtering
- Never run unoptimized queries in production

---

## 4. Design for Failure
- What happens if:
  - Supabase goes down?
  - WebSocket disconnects?

👉 Always implement fallback polling

---

## 5. Keep Components Dumb
- UI components = presentational
- Business logic = hooks/services

---

## 6. Avoid Overengineering Early
- Build MVP first:
  - Event listing
  - Ticket purchase
  - Basic map

🚫 Skip fancy animations initially

---

## 7. Security First, Not Later
- Implement RLS from Day 1
- Never expose API keys
- Validate everything server-side

---

## 8. Optimize for Mobile First
- 80% users = mobile
- Test on low-end devices

---

## 9. Use Feature Isolation
- events/
- ticketing/
- admin/

👉 No cross-feature chaos

---

## 10. Logging is Mandatory
- Track:
  - ticket scans
  - user actions
  - failures

---

## 11. Avoid UI Lies
- Crowd-O-Meter must be accurate
- Fake real-time = user distrust

---

## 12. Map Performance Matters
- Limit markers
- Use clustering for high density

---

## 13. Version Your APIs
- Never break frontend on updates

---

## 14. Always Measure
- Track:
  - latency
  - API response time
  - WebSocket delays

---

## 15. Build for Scale (Even if small now)
- Assume:
  - 10k users
  - 100 events live