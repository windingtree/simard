interface KeyValue {
    fieldName: string;
    fieldValue: any;
}
export class ToStringBuilder {
    private readonly className: string;
    private fields: KeyValue[];
    constructor(className: string) {
        this.className = className;
        this.fields = [];
    }

    public addField(fieldName: string, fieldValue: any): ToStringBuilder {
        const keyVal: KeyValue = {
            fieldName,
            fieldValue,
        };
        this.fields.push(keyVal);
        return this;
    }

    public build(): string {
        const commaSeparatedFields = this.fields.map(field => {
            return `[${field.fieldName}=${field.fieldValue}]`;
        }).join(',');
        return `${this.className}, ${commaSeparatedFields}`;
    }
}
