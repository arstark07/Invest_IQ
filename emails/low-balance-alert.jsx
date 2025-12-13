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

export default function LowBalanceAlertEmail({
  userName,
  currentBalance,
  monthlyBudget,
  thresholdPercentage,
  accountName,
}) {
  const currentBalanceDisplay = `Rs. ${currentBalance.toLocaleString("en-IN")}`;
  const budgetDisplay = `Rs. ${monthlyBudget.toLocaleString("en-IN")}`;
  const thresholdAmount = (monthlyBudget * thresholdPercentage) / 100;
  const thresholdDisplay = `Rs. ${thresholdAmount.toLocaleString("en-IN")}`;

  return (
    <Html>
      <Head />
      <Preview>Low Balance Alert - InvestIQ</Preview>
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
            <Text style={alertTitleStyle}>📊 Low Balance Alert</Text>
            <Text style={alertMessageStyle}>
              Your account balance has fallen below the {thresholdPercentage}% threshold of
              your monthly budget.
            </Text>
          </Section>

          <Section style={detailsBoxStyle}>
            <Row>
              <Column style={{ width: "50%" }}>
                <Text style={labelStyle}>Current Balance</Text>
                <Text style={{ ...valueStyle, color: "#ff9800" }}>
                  {currentBalanceDisplay}
                </Text>
              </Column>
              <Column style={{ width: "50%" }}>
                <Text style={labelStyle}>Alert Threshold</Text>
                <Text style={valueStyle}>{thresholdDisplay}</Text>
              </Column>
            </Row>

            <Hr style={dividerStyle} />

            <Row>
              <Column style={{ width: "100%" }}>
                <Text style={labelStyle}>Monthly Budget</Text>
                <Text style={valueStyle}>{budgetDisplay}</Text>
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

          <Section style={recommendationsStyle}>
            <Text style={recommendationsHeaderStyle}>Recommendations:</Text>
            <Text style={recommendationItemStyle}>
              • Consider adding funds to your account soon
            </Text>
            <Text style={recommendationItemStyle}>
              • Review your recent spending to manage expenses better
            </Text>
            <Text style={recommendationItemStyle}>
              • Check your transaction history for any unusual activity
            </Text>
            <Text style={recommendationItemStyle}>
              • Set up automatic transfers if available
            </Text>
          </Section>

          <Section style={ctaStyle}>
            <Link href="https://investiq.app/dashboard" style={ctaButtonStyle}>
              View Account Details
            </Link>
          </Section>

          <Hr style={dividerStyle} />

          <Text style={footerTextStyle}>
            You won&apos;t receive another alert until your balance crosses the threshold
            again.
          </Text>

          <Text style={disclaimerStyle}>
            This is an automated alert. Please do not reply to this email.
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
  backgroundColor: "#fff8e1",
  border: "1px solid #ffe082",
  borderRadius: "8px",
  padding: "15px",
  margin: "20px 0",
};

const alertTitleStyle = {
  fontSize: "16px",
  fontWeight: "700",
  color: "#f57f17",
  margin: "0 0 10px 0",
};

const alertMessageStyle = {
  fontSize: "14px",
  color: "#f57f17",
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

const recommendationsStyle = {
  backgroundColor: "#f0f4ff",
  border: "1px solid #c5cae9",
  borderRadius: "8px",
  padding: "20px",
  margin: "20px 0",
};

const recommendationsHeaderStyle = {
  fontSize: "14px",
  fontWeight: "600",
  color: "#3f51b5",
  margin: "0 0 15px 0",
};

const recommendationItemStyle = {
  fontSize: "13px",
  color: "#3f51b5",
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
