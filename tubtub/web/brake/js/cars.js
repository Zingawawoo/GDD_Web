import { pad3, pad4 } from "./utils.js";

export const COLOR_SWATCHES = {
  Blue: "#4aa8ff",
  Black: "#20242c",
  Brown: "#8b5a3c",
  Green: "#49c46a",
  Magenta: "#e34b9a",
  Red: "#f05454",
  White: "#e9edf2",
  Yellow: "#f2cc4d",
  Default: "#9aa3ad",
};

export const SHARED_COLORS = ["Blue", "Black", "Brown", "Green", "Magenta", "Red", "White", "Yellow"];

export const CAR_CATALOG = [
  {
    id: "sport",
    label: "Sport",
    colors: SHARED_COLORS,
    path: (color) => `Assets/cars/SPORT TOPDOWN/${color}/SEPARATED`,
    file: (color, index) => `${color}_SPORT_CLEAN_All_${pad3(index)}.png`,
  },
  {
    id: "supercar",
    label: "Supercar",
    colors: SHARED_COLORS,
    path: (color) => `Assets/cars/SUPERCAR TOPDOWN/${color}/SEPARATED`,
    file: (color, index) => `${color}_SUPERCAR_CLEAN_All_${pad3(index)}.png`,
  },
  {
    id: "musclecar",
    label: "Musclecar",
    colors: SHARED_COLORS,
    path: (color) => `Assets/cars/MUSCLECAR TOPDOWN/${color}/SEPARATED`,
    file: (color, index) => `${color}_MUSCLECAR_CLEAN_All_${pad3(index)}.png`,
  },
  {
    id: "luxury",
    label: "Luxury",
    colors: SHARED_COLORS,
    path: (color) => `Assets/cars/LUXURY TOPDOWN/${color}/SEPARATED`,
    file: (color, index) => `${color}_LUXURY_CLEAN_All_${pad3(index)}.png`,
  },
  {
    id: "limo",
    label: "Limo",
    colors: SHARED_COLORS,
    path: (color) => `Assets/cars/LIMO TOPDOWN/${color}/SEPARATED`,
    file: (color, index) => `${color}_LIMO_CLEAN_All_${pad3(index)}.png`,
  },
  {
    id: "coupe",
    label: "Coupe",
    colors: SHARED_COLORS,
    path: (color) => `Assets/cars/COUPE TOPDOWN/${color}/SEPARATED`,
    file: (color, index) => `${color}_COUPE_CLEAN_All_${pad3(index)}.png`,
  },
  {
    id: "civic",
    label: "Civic",
    colors: SHARED_COLORS,
    path: (color) => `Assets/cars/CIVIC TOPDOWN/${color}/SEPARATED`,
    file: (color, index) => `${color}_CIVIC_CLEAN_All_${pad3(index)}.png`,
  },
  {
    id: "sedan",
    label: "Sedan",
    colors: SHARED_COLORS,
    path: (color) => `Assets/cars/SEDAN TOPDOWN/${color}/SEPARATED`,
    file: (color, index) => `${color}_SEDAN_CLEAN_All_${pad3(index)}.png`,
  },
  {
    id: "hatchback",
    label: "Hatchback",
    colors: SHARED_COLORS,
    path: (color) => `Assets/cars/HATCHBACK TOPDOWN/${color}/SEPARATED`,
    file: (color, index) => `${color}_HatchBack_CLEAN_All_${pad3(index)}.png`,
  },
  {
    id: "micro",
    label: "Micro",
    colors: SHARED_COLORS,
    path: (color) => `Assets/cars/MICRO TOPDOWN/${color}/SEPARATED`,
    file: (color, index) => `${color}_MICRO_CLEAN_All_${pad3(index)}.png`,
  },
  {
    id: "suv",
    label: "SUV",
    colors: SHARED_COLORS,
    path: (color) => `Assets/cars/SUV TOPDOWN/${color}/SEPARATED`,
    file: (color, index) => `${color}_SUV_CLEAN_All_${pad3(index)}.png`,
  },
  {
    id: "jeep",
    label: "Jeep",
    colors: SHARED_COLORS,
    path: (color) => `Assets/cars/JEEP TOP DOWN/${color}/SEPARATED`,
    file: (color, index) => `${color}_JEEP_CLEAN_All_${pad3(index)}.png`,
  },
  {
    id: "van",
    label: "Van",
    colors: SHARED_COLORS,
    path: (color) => `Assets/cars/VAN TOP DOWN/${color}/SEPARATED`,
    file: (color, index) => `${color}_VAN_CLEAN_All_${pad3(index)}.png`,
  },
  {
    id: "minivan",
    label: "Minivan",
    colors: SHARED_COLORS,
    path: (color) => `Assets/cars/MINIVAN TOPDOWN/${color}/SEPARATED`,
    file: (color, index) => `${color}_MINIVAN_CLEAN_All_${pad3(index)}.png`,
  },
  {
    id: "wagon",
    label: "Wagon",
    colors: SHARED_COLORS,
    path: (color) => `Assets/cars/WAGON TOPDOWN/${color}/SEPARATED`,
    file: (color, index) => `${color}_WAGON_CLEAN_All_${pad3(index)}.png`,
  },
  {
    id: "pickup",
    label: "Pickup",
    colors: SHARED_COLORS,
    path: (color) => `Assets/cars/PICKUP TOPDOWN/${color}/SEPARATED`,
    file: (color, index) => `${color}_PICKUP_CLEAN_All_${pad3(index)}.png`,
  },
  {
    id: "camper",
    label: "Camper",
    colors: SHARED_COLORS,
    path: (color) => `Assets/cars/CAMPER TOPDOWN/${color}/SEPARATED`,
    file: (color, index) => `${color}_CAMPER_CLEAN_All_${pad3(index)}.png`,
  },
  {
    id: "box_truck",
    label: "Box Truck",
    colors: SHARED_COLORS,
    path: (color) => `Assets/cars/BOX TRUCK TOPDOWN/${color}/SEPARATED`,
    file: (color, index) => `${color}_BOXTRUCK_CLEAN_All_${pad3(index)}.png`,
  },
  {
    id: "medium_truck",
    label: "Medium Truck",
    colors: SHARED_COLORS,
    path: (color) => `Assets/cars/MEDIUM TRUCK TOPDOWN/${color}/SEPARATED`,
    file: (color, index) => `${color}_MEDIUMTRUCK_CLEAN_All_${pad3(index)}.png`,
  },
  {
    id: "bus",
    label: "Bus",
    colors: SHARED_COLORS,
    path: (color) => `Assets/cars/BUS TOPDOWN/${color}/SEPARATED`,
    file: (color, index) =>
      color === "Blue" ? `BUS_CLEAN_ALLD${pad4(index)}.png` : `${color}_BUS_CLEAN_All_${pad3(index)}.png`,
  },
  {
    id: "taxi",
    label: "Taxi",
    colors: ["Default"],
    path: () => "Assets/cars/TAXI TOPDOWN/ALL DIRECTION/SEPARATED",
    file: (_, index) => `TAXI_CLEAN_ALLD${pad4(index)}.png`,
  },
  {
    id: "ambulance",
    label: "Ambulance",
    colors: ["Default"],
    path: () => "Assets/cars/AMBULANCE TOPDOWN/ALL DIRECTION/SEPARATED",
    file: (_, index) => `AMBULANCE_CLEAN_ALLD${pad4(index)}.png`,
  },
  {
    id: "police",
    label: "Police",
    colors: ["Default"],
    path: () => "Assets/cars/POLICE TOPDOWN/ALL DIRECTION/SEPARATED",
    file: (_, index) => `POLICE_CLEAN_ALLD${pad4(index)}.png`,
  },
];

export function previewUrl(entry, color, index) {
  return `${entry.path(color)}/${entry.file(color, index)}`;
}
