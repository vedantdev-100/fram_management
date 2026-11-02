from decimal import Decimal
from hypothesis import given, strategies as st
from apps.costing.arithmetic import allocate, money, depreciation, gdd


@given(
    st.decimals(min_value="-100000", max_value="100000", places=2),
    st.lists(st.decimals(min_value="0", max_value="1000", places=4), min_size=1, max_size=20),
)
def test_allocation_conserves_cents(amount, weights):
    assert sum(allocate(amount, weights)) == money(amount)


def test_remainder_goes_to_largest_share():
    assert allocate(Decimal("1"), [1, 1, 1]) == [Decimal(".34"), Decimal(".33"), Decimal(".33")]


def test_depreciation_floor():
    assert depreciation(100, 20, 10, 100) == 80


def test_gdd():
    assert gdd(20, 32, 10) == 16
    assert gdd(2, 8, 10) == 0
