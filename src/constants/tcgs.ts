import type { Tcg } from '@/types'

// Única fuente de los TCG soportados: el selector del ConfigPage y el productTypeID que la function
// `chasing-cards` envía a la Price Guide. Sin productTypeID confirmado la API no devuelve cartas, así
// que quedan fuera: Dragon Ball Super 27, Final Fantasy 24, Flesh and Blood 62, Gundam 86,
// Pokémon Japan 85, Riftbound 89, Star Wars: Unlimited 79 y Union Arena 81.
export const TCGS: readonly Tcg[] = [
  { id: 71, label: 'Disney Lorcana', productTypeId: 116 },
  { id: 63, label: 'Digimon Card Game', productTypeId: 103 },
  { id: 80, label: 'Dragon Ball Super: Fusion World', productTypeId: 134 },
  { id: 1, label: 'Magic: The Gathering', productTypeId: 1 },
  { id: 68, label: 'One Piece Card Game', productTypeId: 110 },
  { id: 3, label: 'Pokémon', productTypeId: 1 },
  { id: 2, label: 'Yu-Gi-Oh!', productTypeId: 1 },
]
