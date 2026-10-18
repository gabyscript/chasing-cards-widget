export interface Tcg {
  id: number
  label: string
  productTypeId: number
}

export interface TcgSet {
  setNameId: number
  categoryId: number
  name: string
  abbreviation: string
  releaseDate: string | null
  isSupplemental: boolean
}

export interface ChasingCard {
  productId: number
  name: string
  setName: string
  number: string | null
  rarity: string | null
  marketPrice: number
  imageUrl: string
}

export interface ChasingCardsResponse {
  setName: string
  setCode: string | null
  updatedAt: string
  cards: ChasingCard[]
}

export type Currency = 'USD'

export type AnimationType = 'slide' | 'fade' | 'flip'

export type TextColor = 'white' | 'black' | `#${string}`

export interface WidgetConfig {
  tcg: number | null
  setId: number
  total: number
  showPrice: boolean
  currency: Currency
  duration: number
  textColor: TextColor
  showTitle: boolean
  title: string
  showName: boolean
  animation: AnimationType
  refresh: number
  cardWidth: number
}

export type WidgetSettings = Omit<WidgetConfig, 'setId'>

export interface ApiError {
  message: string
  status: number
}
