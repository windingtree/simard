export function mapToObj(inputMap: any): any {
    const obj = {};
    try {
        if (inputMap) {
            inputMap.forEach((value, key) => {
                obj[key] = value;
            });
        }
        // tslint:disable-next-line:no-empty
    } catch (err: any) {
        console.log('FIXME - empty catch');
    }
    return obj;
}
