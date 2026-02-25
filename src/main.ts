import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger, ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';

async function bootstrap() {
    const app = await NestFactory.create(AppModule);
    const logger = new Logger('AppelsOffres-Bootstrap');

    // Security: HTTP headers
    app.use(helmet());

    // Input validation
    app.useGlobalPipes(
        new ValidationPipe({
            whitelist: true,
            transform: true,
            forbidNonWhitelisted: true,
        }),
    );

    // Global API Prefix
    app.setGlobalPrefix('api');

    // Swagger Documentation
    const config = new DocumentBuilder()
        .setTitle("Microservice Appels d'Offres")
        .setDescription("Al-Mizan API pour la gestion du cycle de vie des appels d'offres")
        .setVersion('1.0')
        .addBearerAuth( // Will use session ID from API Gateway in reality, but this models auth
            { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
            'session-auth',
        )
        .build();

    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api/docs', app, document);

    // Start Server
    const port = process.env.PORT || 8003;
    await app.listen(port);

    logger.log(`🚀 Microservice Appels d'Offres running on port ${port}`);
    logger.log(`📚 Swagger documentation accessible at: http://localhost:${port}/api/docs`);
}

bootstrap();
