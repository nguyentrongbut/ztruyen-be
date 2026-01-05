export function formatExpireTime(expireString: string) {
  const unit = expireString.slice(-1).toLowerCase();
  const value = parseInt(expireString.slice(0, -1));

  const timeUnits = {
    s: value === 1 ? 'giây' : 'giây',
    m: value === 1 ? 'phút' : 'phút',
    h: value === 1 ? 'giờ' : 'giờ',
    d: value === 1 ? 'ngày' : 'ngày',
  };

  return `${value} ${timeUnits[unit] || 'phút'}`;
}
