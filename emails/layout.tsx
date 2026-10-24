import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Section,
  Text,
} from "@react-email/components";
import type { ReactNode } from "react";

export function EmailLayout({
  preview,
  heading,
  children,
  cta,
  richContent = false,
}: {
  preview: string;
  heading: string;
  children: ReactNode;
  cta?: { label: string; href: string };
  /** Rich announcement content contains its own block elements. */
  richContent?: boolean;
}) {
  return (
    <Html>
      <Head />
      <Preview>{preview}</Preview>
      <Body style={{ backgroundColor: "#f6f6f7", fontFamily: "Helvetica, Arial, sans-serif" }}>
        <Container
          style={{
            backgroundColor: "#ffffff",
            margin: "32px auto",
            padding: "32px",
            maxWidth: "480px",
            borderRadius: "12px",
          }}
        >
          <Heading as="h1" style={{ fontSize: "22px", margin: "0 0 16px" }}>
            {heading}
          </Heading>
          {richContent ? (
            <Section style={{ fontSize: "15px", lineHeight: "24px", color: "#333" }}>{children}</Section>
          ) : (
            <Text style={{ fontSize: "15px", lineHeight: "24px", color: "#333" }}>{children}</Text>
          )}
          {cta ? (
            <Section style={{ margin: "24px 0" }}>
              <Button
                href={cta.href}
                style={{
                  backgroundColor: "#111",
                  color: "#fff",
                  padding: "12px 20px",
                  borderRadius: "8px",
                  fontSize: "15px",
                }}
              >
                {cta.label}
              </Button>
            </Section>
          ) : null}
          {cta ? (
            <Text style={{ fontSize: "12px", color: "#777", wordBreak: "break-all" }}>
              Or paste this link into your browser: {cta.href}
            </Text>
          ) : null}
        </Container>
      </Body>
    </Html>
  );
}
