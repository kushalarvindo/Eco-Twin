import math

def calculate(kind, baseline, reduction):
    if kind not in ['waste', 'energy', 'water', 'carbon']:
        raise ValueError('Choose waste, energy, water or carbon.')
    try:
        baseline = float(baseline)
        reduction = float(reduction)
    except (ValueError, TypeError):
        raise ValueError('Enter numeric baseline and reduction values.')
    if not math.isfinite(baseline) or baseline < 0 or baseline > 1e9:
        raise ValueError('Baseline must be between 0 and 1 billion.')
    if not math.isfinite(reduction) or not 0 <= reduction <= 100:
        raise ValueError('Reduction must be between 0 and 100%.')
    saved = baseline * reduction / 100
    units = {
        'waste': 'kg/day',
        'energy': 'kWh/day',
        'water': 'L/day',
        'carbon': 'kg CO2e/day',
    }
    assumptions = (
        'User-entered hypothetical baseline. Linear reduction; no real-world outcome is predicted. '
        'Carbon scenario models illustrative operational GHG reductions (CEA grid ~0.82 kg CO2e/kWh / fleet transit); not a certified GHG audit.'
        if kind == 'carbon'
        else 'User-entered hypothetical baseline. Linear reduction; no real-world outcome is predicted.'
    )
    return {
        'baseline': baseline,
        'scenario': round(baseline - saved, 4),
        'saved': round(saved, 4),
        'percent': reduction if baseline else None,
        'unit': units[kind],
        'model_version': 'reduction-v1',
        'data_kind': 'simulation',
        'assumptions': assumptions,
    }
