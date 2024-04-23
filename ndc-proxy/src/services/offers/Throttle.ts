export function Throttle(timeout: number): (target: any, propertyKey: string, descriptor: PropertyDescriptor) => PropertyDescriptor {
    return (
        target: any,
        propertyKey: string,
        descriptor: PropertyDescriptor
    ) => {
        const originalMethod = descriptor.value;

        // tslint:disable-next-line:typedef
        descriptor.value = async function (...args: any[]) {
            return Promise.race([
                originalMethod.apply(this, args),
                new Promise<any>((_, reject) =>
                    setTimeout(() => reject(new ThrottlingTimeoutError(`Method execution timed out, exceeded ${timeout}`)), timeout)
                ),
            ]);
        };

        return descriptor;
    };
}

export class ThrottlingTimeoutError extends Error {
    constructor(message: string) {
        super(message);
        // Set the prototype explicitly to ensure proper inheritance
        Object.setPrototypeOf(this, ThrottlingTimeoutError.prototype);
    }
}
