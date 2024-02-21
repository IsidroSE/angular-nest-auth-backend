import { Prop } from "@nestjs/mongoose/dist/decorators/prop.decorator";
import { Schema } from "@nestjs/mongoose/dist/decorators/schema.decorator";
import { SchemaFactory } from "@nestjs/mongoose/dist/factories/schema.factory";

@Schema()
export class User {
    // _id: string;

    @Prop({ unique: true, required: true })
    email: string;

    @Prop({ required: true })
    name: string;

    @Prop({ minlength: 6, required: true })
    password?: string;

    @Prop({ default: true })
    isActive: boolean;

    @Prop({ type: [String], default: ['user'] })
    roles: string[];
}

export const UserSchema = SchemaFactory.createForClass(User);