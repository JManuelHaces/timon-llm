import pytest
from pydantic import ValidationError

from timon_engine.knobs import KnobVector, knobs_to_steering_vector


def test_knobvector_defaults_to_50():
    k = KnobVector()
    assert k.formality == 50
    assert k.urgency == 50
    assert k.warmth == 50
    assert k.detail == 50


def test_knobvector_rejects_out_of_range():
    with pytest.raises(ValidationError):
        KnobVector(formality=101)


def test_knobs_to_steering_vector_centers_at_zero():
    # 50 = neutro → 0.0 ; rango -1.0..1.0
    vec = knobs_to_steering_vector(KnobVector())
    assert vec == {"formality": 0.0, "urgency": 0.0, "warmth": 0.0, "detail": 0.0}


def test_knobs_to_steering_vector_extremes():
    vec = knobs_to_steering_vector(KnobVector(formality=100, urgency=0))
    assert vec["formality"] == pytest.approx(1.0)
    assert vec["urgency"] == pytest.approx(-1.0)
