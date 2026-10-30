package com.aespejo.registrations.infrastructure.security;

import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.annotation.Order;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.oauth2.core.DelegatingOAuth2TokenValidator;
import org.springframework.security.oauth2.core.OAuth2Error;
import org.springframework.security.oauth2.core.OAuth2TokenValidator;
import org.springframework.security.oauth2.core.OAuth2TokenValidatorResult;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.security.oauth2.jwt.JwtValidators;
import org.springframework.security.oauth2.jwt.NimbusJwtDecoder;
import org.springframework.security.web.SecurityFilterChain;

/**
 * Athlete portal security: tokens issued by Auth0 for this API's audience. It is a separate chain that matches only the
 * portal routes, so the internal back-office tokens keep their own rules.
 */
@Configuration
public class PortalSecurityConfig {

    @Bean(name = "auth0JwtDecoder")
    JwtDecoder auth0JwtDecoder(@Value("${auth0.domain:}") String domain,
                               @Value("${auth0.audience:}") String audience) {
        String issuer = "https://" + domain + "/";
        NimbusJwtDecoder decoder = NimbusJwtDecoder.withJwkSetUri(issuer + ".well-known/jwks.json").build();
        OAuth2TokenValidator<Jwt> audienceValidator = token -> token.getAudience().contains(audience)
                ? OAuth2TokenValidatorResult.success()
                : OAuth2TokenValidatorResult.failure(new OAuth2Error("invalid_token", "The token is not for this API.", null));
        decoder.setJwtValidator(new DelegatingOAuth2TokenValidator<>(JwtValidators.createDefaultWithIssuer(issuer), audienceValidator));
        return decoder;
    }

    @Bean
    @Order(1)
    SecurityFilterChain portalSecurityFilterChain(HttpSecurity http,
                                                  @Qualifier("auth0JwtDecoder") JwtDecoder auth0Decoder) throws Exception {
        return http
                .securityMatcher("/api/athlete-portal/**")
                .csrf(AbstractHttpConfigurer::disable)
                .cors(Customizer.withDefaults())
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(auth -> auth.anyRequest().authenticated())
                .oauth2ResourceServer(oauth -> oauth.jwt(jwt -> jwt.decoder(auth0Decoder)))
                .build();
    }
}
