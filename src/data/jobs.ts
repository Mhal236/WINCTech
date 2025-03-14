export interface Job {
  id: number;
  title: string;
  description: string;
  location: { lat: number; lng: number };
  customer: string;
  address: string;
  damage: string;
  price: string;
  image?: string; // optional property for damage image
  vehicle: string;
}

export const jobsData = [
  {
    id: 1,
    title: "Windscreen Replacement",
    description: "Front windscreen replacement needed",
    customer: "John Smith",
    vehicle: "BMW 3 Series",
    damage: "Cracked Windscreen",
    insurance: "Direct Line",
    price: "£299.99",
    timeline: "ASAP",
    address: "123 London Road",
    location: { lat: 51.5074, lng: -0.1278 },
    image: "/images/windscreen-damage.jpg"
  },
  {
    id: 2,
    title: "Windscreen Repair - Audi",
    location: { lat: 51.5225, lng: -0.1571 }, // Baker Street
    description: "Small chip repair needed on driver's side. No sensor interference.",
    customer: "Emma Thompson",
    address: "221B Baker Street, London NW1 6XE",
    damage: "Chip",
    price: "£89.99",
    urgency: "Medium",
    insurance: "Admiral",
    timeline: "Tomorrow",
    vehicle: "Audi A4",
    image: "/images/damage/windscreen-2.jpg"
  },
  {
    id: 3,
    title: "Side Window Replacement - Mercedes",
    location: { lat: 51.4994, lng: -0.1345 }, // Westminster
    description: "Driver's side window shattered. Immediate replacement needed.",
    customer: "David Mitchell",
    address: "12 Victoria Street, London SW1H 0AX",
    damage: "Shattered",
    price: "£199.99",
    urgency: "High",
    insurance: "Aviva",
    timeline: "Today",
    vehicle: "Mercedes-Benz C-Class",
    image: "/images/damage/windscreen-3.jpg"
  },
  {
    id: 4,
    title: "Rear Windscreen - Range Rover",
    location: { lat: 51.5136, lng: -0.0898 }, // Liverpool Street
    description: "Rear windscreen crack with heating elements. Full replacement required.",
    customer: "Sarah Parker",
    address: "45 Liverpool Street, London EC2M 7PY",
    damage: "Cracked",
    price: "£449.99",
    urgency: "Medium",
    insurance: "AXA",
    timeline: "Tomorrow",
    vehicle: "Range Rover",
    image: "/images/damage/windscreen-4.jpg"
  },
  {
    id: 5,
    title: "Windscreen Repair - Toyota",
    location: { lat: 51.5206, lng: -0.1025 }, // Barbican
    description: "Stone chip repair needed. Less than 2cm diameter.",
    customer: "Michael Chen",
    address: "33 Silk Street, London EC2Y 8DS",
    damage: "Chip",
    price: "£69.99",
    urgency: "Low",
    insurance: "LV",
    timeline: "This Week",
    vehicle: "Toyota Camry",
    image: "/images/damage/windscreen-5.jpg"
  }
]; 