package com.camunda.start.headersec;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.header.writers.XXssProtectionHeaderWriter;
import org.springframework.security.web.util.matcher.AnyRequestMatcher;

@Configuration
public class HeaderSecurityConfiguration {

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        return http
            .csrf().disable()
            .authorizeHttpRequests()
                .anyRequest().permitAll()
            .and()
            .headers()
                .httpStrictTransportSecurity()
                    .maxAgeInSeconds(63072000)
                    .preload(true)
                    .includeSubDomains(true)
                    .requestMatcher(AnyRequestMatcher.INSTANCE)
                .and()
                    .xssProtection(xss -> xss.headerValue(XXssProtectionHeaderWriter.HeaderValue.ENABLED_MODE_BLOCK))
                    .contentSecurityPolicy("default-src 'none'; script-src 'unsafe-inline' 'self'; connect-src 'self'; img-src 'self'; style-src 'unsafe-inline' 'self'; frame-ancestors 'self'; form-action 'self';")
                .and().and()
            .build();
    }

}
