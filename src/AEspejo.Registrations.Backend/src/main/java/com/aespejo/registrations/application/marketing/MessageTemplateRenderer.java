package com.aespejo.registrations.application.marketing;

import com.aespejo.registrations.common.exception.BusinessRuleException;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Set;
import java.util.function.Function;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Resolves the {@code {{variable}}} placeholders of a campaign body. The double
 * braces are the format of Meta templates, so the same body serves the panel preview and the positional parameters of
 * the Cloud API. Unknown variables are rejected when the campaign is saved, not when it is sent.
 */
public final class MessageTemplateRenderer {

    private static final Pattern VARIABLE = Pattern.compile("\\{\\{\\s*([a-zA-Z_][a-zA-Z0-9_]*)\\s*\\}\\}");
    private static final Pattern POSITIONAL = Pattern.compile("\\{\\{\\s*(\\d+)\\s*\\}\\}");
    private static final DateTimeFormatter DATE = DateTimeFormatter.ofPattern("dd/MM/yyyy");

    /** Variables a body may use, in the order they are passed as parameters to Meta. */
    public static final List<String> ADMITTED = List.of(
            "nombre", "apellido", "nombre_completo", "ciudad", "evento", "fecha_evento", "lugar_evento");

    private MessageTemplateRenderer() {
    }

    /** The data that fills the variables for one recipient. */
    public record Context(
            String firstNames,
            String lastNames,
            String city,
            String eventName,
            LocalDate eventDate,
            String eventLocation) {
    }

    /** Rejects an empty body or one that uses variables that do not exist. */
    public static void validate(String body) {
        if (body == null || body.isBlank()) {
            throw new BusinessRuleException("campaign.body.empty");
        }

        Set<String> unknown = new LinkedHashSet<>();
        Matcher matcher = VARIABLE.matcher(body);

        while (matcher.find()) {
            String variable = matcher.group(1).toLowerCase(Locale.ROOT);
            if (!ADMITTED.contains(variable)) {
                unknown.add("{{" + variable + "}}");
            }
        }

        if (!unknown.isEmpty()) {
            throw new BusinessRuleException("campaign.variables.unknown",
                    String.join(", ", unknown),
                    String.join(", ", ADMITTED.stream().map(v -> "{{" + v + "}}").toList()));
        }
    }

    /** Replaces every variable with the recipient's data. */
    public static String render(String body, Context context) {
        String named = replace(VARIABLE, body, m -> resolve(m.group(1).toLowerCase(Locale.ROOT), context));
        return replace(POSITIONAL, named, m -> resolvePositional(Integer.parseInt(m.group(1)), context));
    }

    /**
     * The values of the variables used by the body, in order of appearance. This is the {@code parameters} list of a
     * Meta template: named variables first, then positional ones, as.
     */
    public static List<String> parameters(String body, Context context) {
        List<String> values = new ArrayList<>();

        Matcher named = VARIABLE.matcher(body);
        while (named.find()) {
            values.add(resolve(named.group(1).toLowerCase(Locale.ROOT), context));
        }

        Matcher positional = POSITIONAL.matcher(body);
        while (positional.find()) {
            values.add(resolvePositional(Integer.parseInt(positional.group(1)), context));
        }

        return values;
    }

    private static String resolvePositional(int position, Context context) {
        return switch (position) {
            case 1 -> firstName(context.firstNames());
            case 2 -> orEmpty(context.eventName());
            case 3 -> context.eventDate() == null ? "" : context.eventDate().format(DATE);
            case 4 -> orEmpty(context.eventLocation());
            case 5 -> orEmpty(context.city());
            case 6 -> orEmpty(context.lastNames());
            case 7 -> (context.firstNames() + " " + context.lastNames()).trim();
            default -> "";
        };
    }

    private static String resolve(String variable, Context context) {
        return switch (variable) {
            case "nombre" -> firstName(context.firstNames());
            case "apellido" -> orEmpty(context.lastNames());
            case "nombre_completo" -> (context.firstNames() + " " + context.lastNames()).trim();
            case "ciudad" -> orEmpty(context.city());
            case "evento" -> orEmpty(context.eventName());
            case "fecha_evento" -> context.eventDate() == null ? "" : context.eventDate().format(DATE);
            case "lugar_evento" -> orEmpty(context.eventLocation());
            default -> "";
        };
    }

    /** Only the first name: a promotional WhatsApp that greets with the full list of names reads like a form. */
    private static String firstName(String names) {
        if (names == null) {
            return "";
        }

        int space = names.indexOf(' ');
        return space < 0 ? names : names.substring(0, space);
    }

    private static String orEmpty(String value) {
        return value == null ? "" : value;
    }

    private static String replace(Pattern pattern, String text, Function<Matcher, String> value) {
        Matcher matcher = pattern.matcher(text);
        StringBuilder result = new StringBuilder();

        while (matcher.find()) {
            matcher.appendReplacement(result, Matcher.quoteReplacement(value.apply(matcher)));
        }

        matcher.appendTail(result);
        return result.toString();
    }
}
