package com.aespejo.registrations.infrastructure.files;

import com.aespejo.registrations.common.exception.BusinessRuleException;
import java.awt.Color;
import java.awt.Graphics2D;
import java.awt.RenderingHints;
import java.awt.image.BufferedImage;
import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.util.Iterator;
import javax.imageio.IIOImage;
import javax.imageio.ImageIO;
import javax.imageio.ImageWriteParam;
import javax.imageio.ImageWriter;
import javax.imageio.stream.ImageOutputStream;
import org.springframework.stereotype.Component;

/**
 * Fits an image inside a square without cropping it, filling the rest with white, and encodes it as JPEG (quality 85).
 * This is the {@code ResizeMode.Pad} behaviour of the C# reference, implemented with the JDK only.
 */
@Component
public class ImageResizer {

    public static final int SIZE = 500;

    /** Decoding uses ImageIO: the JDK codecs (PNG and JPEG) plus the TwelveMonkeys WebP reader on the classpath. */
    public byte[] fitToSquareJpeg(byte[] content) {
        BufferedImage source;
        try {
            source = ImageIO.read(new ByteArrayInputStream(content));
        } catch (IOException e) {
            source = null;
        }
        if (source == null) {
            throw new BusinessRuleException("upload.processing.failed");
        }

        double scale = Math.min((double) SIZE / source.getWidth(), (double) SIZE / source.getHeight());
        int width = (int) Math.round(source.getWidth() * scale);
        int height = (int) Math.round(source.getHeight() * scale);

        BufferedImage canvas = new BufferedImage(SIZE, SIZE, BufferedImage.TYPE_INT_RGB);
        Graphics2D graphics = canvas.createGraphics();
        graphics.setColor(Color.WHITE);
        graphics.fillRect(0, 0, SIZE, SIZE);
        graphics.setRenderingHint(RenderingHints.KEY_INTERPOLATION, RenderingHints.VALUE_INTERPOLATION_BILINEAR);
        graphics.drawImage(source, (SIZE - width) / 2, (SIZE - height) / 2, width, height, null);
        graphics.dispose();

        return writeJpeg(canvas);
    }

    private static byte[] writeJpeg(BufferedImage image) {
        try (ByteArrayOutputStream out = new ByteArrayOutputStream();
             ImageOutputStream stream = ImageIO.createImageOutputStream(out)) {
            Iterator<ImageWriter> writers = ImageIO.getImageWritersByFormatName("jpg");
            ImageWriter writer = writers.next();
            writer.setOutput(stream);
            ImageWriteParam params = writer.getDefaultWriteParam();
            params.setCompressionMode(ImageWriteParam.MODE_EXPLICIT);
            params.setCompressionQuality(0.85f);
            writer.write(null, new IIOImage(image, null, null), params);
            writer.dispose();
            stream.flush();
            return out.toByteArray();
        } catch (IOException e) {
            throw new BusinessRuleException("upload.processing.failed");
        }
    }
}
