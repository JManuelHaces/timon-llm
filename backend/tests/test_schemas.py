from app.schemas import ChatRequest, PresetCreate


def test_chat_request_parses_knobs():
    req = ChatRequest(prompt="hola", mode="respuesta", knobs={"formality": 80})
    assert req.knobs.formality == 80
    assert req.knobs.urgency == 50  # default


def test_preset_create_requires_name():
    p = PresetCreate(name="Voz Soporte", knobs={"warmth": 90})
    assert p.name == "Voz Soporte"
    assert p.knobs.warmth == 90
