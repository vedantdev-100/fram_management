from decimal import Decimal, ROUND_HALF_UP

D = Decimal


def money(value):
    return D(value).quantize(D(".01"), rounding=ROUND_HALF_UP)


def allocate(amount, weights):
    if not weights:
        return []
    weights = [D(str(w)) for w in weights]
    if any(w < 0 for w in weights):
        raise ValueError("Negative allocation weight")
    total = sum(weights)
    if total <= 0:
        weights = [D(1)] * len(weights)
        total = D(len(weights))
    result = [money(D(amount) * w / total) for w in weights]
    result[max(range(len(weights)), key=lambda i: weights[i])] += money(amount) - sum(result)
    return result


def depreciation(book, salvage, life, quantity):
    if D(life) <= 0:
        raise ValueError("Remaining life must be positive")
    available = max(D(0), D(book) - D(salvage))
    return min(available, money(available / D(life) * D(quantity)))


def gdd(tmin, tmax, base, upper=None):
    tmin, tmax, base = map(D, (tmin, tmax, base))
    if tmin > tmax:
        raise ValueError("Minimum exceeds maximum temperature")
    if upper is not None:
        tmin = min(tmin, D(upper))
        tmax = min(tmax, D(upper))
    return max(D(0), (tmin + tmax) / 2 - base)
