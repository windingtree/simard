import {ArrayMinSize, IsEnum, IsNotEmpty, IsNumber, IsString, Max, Min, ValidateNested} from 'class-validator';
import {LocationType} from './LocationType';
import {Type} from 'class-transformer';

interface LocationRectangleConstructorParameters {
    east: number;
    north: number;
    south: number;
    west: number;
}

export class LocationRectangle {
    @IsNumber()
    @IsNotEmpty()
    @Min(-180)
    @Max(180)
    public east: number;
    @IsNumber()
    @IsNotEmpty()
    @Min(-90)
    @Max(-90)
    public north: number;
    @IsNumber()
    @IsNotEmpty()
    @Min(-90)
    @Max(-90)
    public south: number;

    @IsNumber()
    @IsNotEmpty()
    @Min(-180)
    @Max(180)
    public west: number;

    constructor(params?: LocationRectangleConstructorParameters) {
        if (params) {
            const {east, north, south, west} = params;
            this.east = east;
            this.north = north;
            this.south = south;
            this.west = west;
        }
    }
}

interface LocationPointConstructorParameters {
    lat: number;
    long: number;
}

export class LocationPoint {
    @IsNumber()
    @IsNotEmpty()
    @Min(-90)
    @Max(-90)
    public lat: number;

    @IsNumber()
    @IsNotEmpty()
    @Min(-180)
    @Max(180)
    public long: number;

    constructor(params?: LocationPointConstructorParameters) {
        if (params) {
            const {lat, long} = params;
            this.lat = lat;
            this.long = long;
        }
    }
}

interface LocationCircleConstructorParameters extends LocationPointConstructorParameters {
    radius: number;
}

export class LocationCircle extends LocationPoint {
    @IsNumber()
    @IsNotEmpty()
    @Min(0)
    public radius: number;

    constructor(params?: LocationCircleConstructorParameters) {
        super(params);
        if (params) {
            this.radius = params.radius;
        }
    }
}

export class LocationInformation {

    public static createCircleLocationInstance(circle: LocationCircle): LocationInformation {
        const instance = new LocationInformation();
        instance.circle = circle;
        return instance;
    }
    public static createPolygonLocationInstance(polygon: LocationPoint[]): LocationInformation {
        const instance = new LocationInformation();
        instance.polygon = polygon;
        return instance;
    }
    public static createRectangleLocationInstance(rectangle: LocationRectangle): LocationInformation {
        const instance = new LocationInformation();
        instance.rectangle = rectangle;
        return instance;
    }
    @ValidateNested()
    @Type(() => LocationCircle)
    public circle: LocationCircle;

    @ValidateNested({each: true})
    @Type(() => LocationPoint)
    @ArrayMinSize(3)
    public polygon: LocationPoint[];

    @ValidateNested()
    @Type(() => LocationRectangle)
    public rectangle: LocationRectangle;
}
export class LocationIATA {
    @IsString()
    @IsNotEmpty()
    public iataCode: string;

    @IsNotEmpty()
    @IsEnum(LocationType)
    public locationType: LocationType;

    constructor(iataCode?: string, locationType: LocationType = LocationType.airport) {
        if (iataCode) {
            this.iataCode = iataCode;
        }
        if (locationType) {
            this.locationType = locationType;
        }
    }
}
