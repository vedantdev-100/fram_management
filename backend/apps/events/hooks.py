_handlers = {}


def register(phase, fn):
    if fn not in _handlers.setdefault(phase, []):
        _handlers[phase].append(fn)


def emit(phase, ctx, event, lines, **kwargs):
    for fn in _handlers.get(phase, []):
        fn(ctx, event, lines, **kwargs)
