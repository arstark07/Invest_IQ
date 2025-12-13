import {
  Container,
  Head,
  Hr,
  Html,
  Preview,
  Row,
  Section,
  Text,
  Column,
  Link,
} from "@react-email/components";

export default function OverspendAlertEmail({
  userName,
  attemptedAmount,
  currentBalance,
  accountName,
  shortfall,
}) {
  const attemptedDisplay = `Rs. ${attemptedAmount.toLocaleString("en-IN")}`;
  const balanceDisplay = `Rs. ${currentBalance.toLocaleString("en-IN")}`;
  const shortfallDisplay = `Rs. ${shortfall.toLocaleString("en-IN")}`;

  return (
    <Html>
      <Head />
      <Preview>Transaction Blocked - Insufficient Balance - InvestIQ</Preview>
      <Container style={containerStyle}>
        <Section style={headerStyle}>
          <Row>
            <Column>
              <Text style={logoStyle}>InvestIQ</Text>
            </Column>
          </Row>
        </Section>

        <Section style={bodyStyle}>
          <Text style={greetingStyle}>Hi {userName},</Text>

          <Section style={alertBoxStyle}>
            <Text style={alertTitleStyle}>⚠️ Transaction Blocked</Text>
            <Text style={alertMessageStyle}>
              Your recent transaction attempt was <strong>blocked</strong> due to
              insufficient balance.
            </Text>
          </Section>

          <Section style={detailsBoxStyle}>
            <Row>
              <Column style={{ width: "50%" }}>
                <Text style={labelStyle}>Attempted Amount</Text>
                <Text style={valueStyle}>{attemptedDisplay}</Text>
              </Column>
              <Column style={{ width: "50%" }}>
                <Text style={labelStyle}>Current Balance</Text>
                <Text style={{ ...valueStyle, color: "#d32f2f" }}>
                  {balanceDisplay}
                </Text>
              </Column>
            </Row>

            <Hr style={dividerStyle} />

            <Row>
              <Column style={{ width: "100%" }}>
                <Text style={labelStyle}>Shortfall</Text>
                <Text style={{ ...valueStyle, fontSize: "18px", color: "#d32f2f" }}>
                  -{shortfallDisplay}
                </Text>
              </Column>
            </Row>

            <Hr style={dividerStyle} />

            <Row>
              <Column style={{ width: "100%" }}>
                <Text style={labelStyle}>Account</Text>
                <Text style={valueStyle}>{accountName}</Text>
              </Column>
            </Row>
          </Section>

          <Section style={suggestionsStyle}>
            <Text style={suggestionsHeaderStyle}>Suggested Actions:</Text>
            <Text style={suggestionItemStyle}>
              ✓ Add funds to your account to proceed with the transaction
            </Text>
            <Text style={suggestionItemStyle}>
              ✓ Use a different account with sufficient balance
            </Text>
            <Text style={suggestionItemStyle}>
              ✓ Reduce the transaction amount
            </Text>
            <Text style={suggestionItemStyle}>
              ✓ Link a debit card for immediate top-up
            </Text>
          </Section>

          <Section style={ctaStyle}>
            <Link href="https://investiq.app/dashboard" style={ctaButtonStyle}>
              Go to Dashboard
            </Link>
          </Section>

          <Hr style={dividerStyle} />

          <Text style={footerTextStyle}>
            Need help? Contact our support team or visit our{" "}
            <Link href="https://investiq.app" style={{ color: "#FF6B6B" }}>
              help center
            </Link>
            .
          </Text>

          <Text style={disclaimerStyle}>
            This is an automated security notification. Please do not reply to
            this email.
          </Text>
        </Section>
      </Container>
    </Html>
  );
}

const containerStyle = {
  backgroundColor: "#f9fafb",
  fontFamily: "system-ui, -apple-system, sans-serif",
  fontSize: "14px",
  lineHeight: "1.6",
  color: "#333",
};

const headerStyle = {
  backgroundColor: "#fff",
  padding: "20px 0",
  borderBottom: "1px solid #e5e7eb",
};

const logoStyle = {
  fontSize: "28px",
  fontWeight: "bold",
  color: "#FF6B6B",
  margin: "0",
  padding: "0 20px",
};

const bodyStyle = {
  backgroundColor: "#fff",
  padding: "30px 20px",
};

const greetingStyle = {
  fontSize: "16px",
  fontWeight: "600",
  margin: "0 0 20px 0",
};

const alertBoxStyle = {
  backgroundColor: "#fff3cd",
  border: "1px solid #ffc107",
  borderRadius: "8px",
  padding: "15px",
  margin: "20px 0",
};

const alertTitleStyle = {
  fontSize: "16px",
  fontWeight: "700",
  color: "#856404",
  margin: "0 0 10px 0",
};

const alertMessageStyle = {
  fontSize: "14px",
  color: "#856404",
  margin: "0",
};

const detailsBoxStyle = {
  backgroundColor: "#f3f4f6",
  border: "1px solid #e5e7eb",
  borderRadius: "8px",
  padding: "20px",
  margin: "20px 0",
};

const labelStyle = {
  fontSize: "12px",
  fontWeight: "600",
  color: "#888",
  textTransform: "uppercase",
  letterSpacing: "0.5px",
  margin: "0 0 5px 0",
};

const valueStyle = {
  fontSize: "14px",
  fontWeight: "500",
  color: "#333",
  margin: "0 0 15px 0",
};

const dividerStyle = {
  borderColor: "#e5e7eb",
  margin: "15px 0",
};

const suggestionsStyle = {
  backgroundColor: "#e8f5e9",
  border: "1px solid #c8e6c9",
  borderRadius: "8px",
  padding: "20px",
  margin: "20px 0",
};

const suggestionsHeaderStyle = {
  fontSize: "14px",
  fontWeight: "600",
  color: "#2e7d32",
  margin: "0 0 15px 0",
};

const suggestionItemStyle = {
  fontSize: "13px",
  color: "#2e7d32",
  margin: "8px 0",
};

const ctaStyle = {
  textAlign: "center",
  margin: "30px 0",
};

const ctaButtonStyle = {
  display: "inline-block",
  backgroundColor: "#FF6B6B",
  color: "#fff",
  padding: "12px 30px",
  borderRadius: "6px",
  textDecoration: "none",
  fontWeight: "600",
  fontSize: "14px",
};

const footerTextStyle = {
  fontSize: "13px",
  color: "#666",
  margin: "20px 0",
};

const disclaimerStyle = {
  fontSize: "12px",
  color: "#999",
  fontStyle: "italic",
  textAlign: "center",
  margin: "20px 0 0 0",
};
