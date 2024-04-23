
export abstract class AbstractGliderDataTypeConverter<GliderType, TargetType> {
    public abstract convertFromGlider(input: GliderType): TargetType;
    public abstract convertToGlider(input: TargetType): GliderType;
}
