import math
def calculate(kind,baseline,reduction):
    if kind not in ['waste','energy','water']:raise ValueError('Choose waste, energy or water.')
    try:baseline=float(baseline);reduction=float(reduction)
    except (ValueError,TypeError):raise ValueError('Enter numeric baseline and reduction values.')
    if not math.isfinite(baseline) or baseline<0 or baseline>1e9:raise ValueError('Baseline must be between 0 and 1 billion.')
    if not math.isfinite(reduction) or not 0<=reduction<=100:raise ValueError('Reduction must be between 0 and 100%.')
    saved=baseline*reduction/100
    return {'baseline':baseline,'scenario':round(baseline-saved,4),'saved':round(saved,4),'percent':reduction if baseline else None,'unit':{'waste':'kg/day','energy':'kWh/day','water':'L/day'}[kind],'model_version':'reduction-v1','data_kind':'simulation','assumptions':'User-entered hypothetical baseline. Linear reduction; no real-world outcome is predicted. Carbon not calculated without an emission factor.'}
