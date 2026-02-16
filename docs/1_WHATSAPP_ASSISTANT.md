# 🤖 The WhatsApp AI Assistant: Your 24/7 Sales Agent

The core of Bharat-Biz is an intelligent AI agent that lives inside WhatsApp. For customers, there is no app to download, no website to visit. They simply chat with a contact, just like they do with friends and family.

---

## 🗣️ Voice-First Interaction
In the Indian textile market, typing lengthy messages is rare. Traders prefer voice notes. 

**Bharat-Biz understands:**
- **Hinglish Audio**: *"Bhaiya, pichli baar wala blue cotton hai kya?"*
- **Context**: It remembers previous orders and preferences.
- **Intent**: It knows if you are buying, complaining, or just asking for a price.

---

## 👁️ Visual Understanding
Customers often send photos of fabrics to ask for stock. 

**The AI can:**
1.  **Analyze Images**: Detect pattern, color, and texture.
2.  **Match Inventory**: "Yes, we have a similar floral print in stock."
3.  **Suggest Alternatives**: "That exact print is out, but here is a similar geometric design."

---

## 🧠 Smart Negotiation Logic
This is not a simple chatbot. It has a goal: **Close the Deal.**

### Scenario: The "Out of Stock" Situation
> **Customer:** "I need 500 meters of Red Silk."
> **AI (Internal check):** *Only 200m in stock.*
> **AI (Reply):** "Ji Sir, we have 200m of Red Silk available now. I can ship that today. For the remaining 300m, would you like to see our new Maroon Silk? It's very popular."

### Scenario: The Bargain Hunter
> **Customer:** "Rate kam karo (Lower the price)."
> **AI:** "Sir, this is already our wholesale best price for 500m. If you increase the order to 1000m, I can verify a discount with the owner."

---

## 🔄 The Flow
1.  **Inquiry**: Customer asks for product (Text/Voice/Image).
2.  **Availability Check**: AI queries the live database (`inventory_batches`).
3.  **Quotation**: AI generates a quote with GST and shipping estimates.
4.  **Confirmation**: Customer confirms order.
5.  **Owner Approval**: Order is sent to the Dashboard for final check.

---

[⬅️ Back to Showcase](../PROJECT_SHOWCASE.md)
