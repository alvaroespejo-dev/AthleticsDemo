package com.aespejo.registrations.common.i18n;

import java.util.List;
import java.util.Locale;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.LocaleResolver;
import org.springframework.web.servlet.i18n.AcceptHeaderLocaleResolver;

/**
 * The languages the panel supports. The language comes from the {@code Accept-Language} header of the request;
 * Spanish is the default, because it is the language of the operators.
 */
@Configuration
public class LocaleConfig {

    public static final Locale SPANISH = Locale.forLanguageTag("es");
    public static final Locale ENGLISH = Locale.forLanguageTag("en");
    public static final Locale PORTUGUESE = Locale.forLanguageTag("pt");

    @Bean
    LocaleResolver localeResolver() {
        AcceptHeaderLocaleResolver resolver = new AcceptHeaderLocaleResolver();
        resolver.setSupportedLocales(List.of(SPANISH, ENGLISH, PORTUGUESE));
        resolver.setDefaultLocale(SPANISH);
        return resolver;
    }
}
