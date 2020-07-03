import {DataBinding} from '@int/geotoolkit/data/DataBinding';
import {LogCurve} from '@int/geotoolkit/welllog/LogCurve';
import {MathUtil} from '@int/geotoolkit/util/MathUtil';
import {obfuscate} from '@int/geotoolkit/lib';
export class CurveBinding extends DataBinding {
    constructor() {
        super();
    }
    public accept(node) {
        return node instanceof LogCurve;
    }
    public bind(curve, data) {
        if (data == null) {
            return;
        }
        const id = curve.getName();
        const source = data.getCurveSource(id);
        if (source != null) {
            const limits = MathUtil.calculateNeatLimits(source.getMinValue(), source.getMaxValue());
            if (curve.isCustomLimits() === true) {
                curve.setData(source, false, true);
            } else {
                curve.setData(source, true, true)
                    .setNormalizationLimits(limits.getLow(), limits.getHigh());
            }
        }
    }
    public unbind(curve, data) {
        // TODO: We are not allowed to set data = null
    }
}
obfuscate(CurveBinding);
