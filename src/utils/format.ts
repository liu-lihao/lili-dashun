export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('zh-CN', {
    style: 'currency',
    currency: 'CNY',
    minimumFractionDigits: 2,
  }).format(value)
}

export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('zh-CN').format(date)
}
