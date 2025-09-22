import "jsr:@supabase/functions-js/edge-runtime.d.ts";

interface EmailRequest {
  to: string;
  applicantName: string;
  applicationData: {
    companyName: string;
    businessType: string;
    submittedAt: string;
    applicationId: string;
  };
}

const HTML_TEMPLATE = `
<html>
  <body>
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f9f9f9; padding: 20px;">
      <!-- Header -->
      <div style="background-color: #0FB8C1; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
        <img src="https://d3k81ch9hvuctc.cloudfront.net/company/XjdccL/images/5ca10ab9-79c7-4755-af6e-07ffff417b0a.png" alt="WindscreenCompare Logo" style="max-width: 200px; height: auto; margin-bottom: 10px;">
        <h1 style="margin: 0; font-size: 24px;">
          WindscreenCompare
        </h1>
        <p style="margin: 5px 0 0 0; font-size: 16px;">
          Application Received Successfully
        </p>
      </div>

      <!-- Content -->
      <div style="background-color: white; padding: 30px; border-radius: 0 0 8px 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
        <!-- Confirmation Message -->
        <h2 style="color: #0FB8C1; margin-top: 0; font-size: 20px; margin-bottom: 20px;">
          ✅ Application Submitted Successfully!
        </h2>
        
        <p style="color: #333; font-size: 16px; line-height: 1.6; margin-bottom: 25px;">
          Hi {{applicantName}}, thank you for submitting your technician application to WindscreenCompare. We've received your application and our team will review it shortly.
        </p>

        <!-- Application Summary -->
        <div style="background-color: #e8f8f9; padding: 20px; border-radius: 6px; margin-bottom: 25px; border: 2px solid #0FB8C1;">
          <h3 style="color: #0FB8C1; margin-top: 0; font-size: 18px; margin-bottom: 15px;">
            📋 Application Summary
          </h3>
          <div style="font-size: 14px; line-height: 1.8;">
            <p style="margin: 0 0 8px 0;">
              <strong style="color: #333;">Applicant:</strong> <span style="color: #0FB8C1; font-weight: 600;">{{applicantName}}</span>
            </p>
            <p style="margin: 0 0 8px 0;">
              <strong style="color: #333;">Email:</strong> <span style="color: #0FB8C1; font-weight: 600;">{{email}}</span>
            </p>
            <p style="margin: 0 0 8px 0;">
              <strong style="color: #333;">Business Type:</strong> <span style="color: #0FB8C1; font-weight: 600;">{{businessType}}</span>
            </p>
            <p style="margin: 0 0 8px 0;">
              <strong style="color: #333;">Company:</strong> <span style="color: #0FB8C1; font-weight: 600;">{{companyName}}</span>
            </p>
            <p style="margin: 0;">
              <strong style="color: #333;">Submitted:</strong> <span style="color: #0FB8C1; font-weight: 600;">{{submittedAt}}</span>
            </p>
          </div>
        </div>

        <!-- What Happens Next -->
        <div style="background-color: #d4edda; padding: 20px; border-radius: 6px; margin-bottom: 25px; border-left: 4px solid #28a745;">
          <h3 style="color: #155724; margin-top: 0; font-size: 18px; margin-bottom: 15px;">
            🚀 What Happens Next?
          </h3>
          <div style="color: #155724; font-size: 14px; line-height: 1.8;">
            <ul style="margin: 0; padding-left: 20px;">
              <li style="margin-bottom: 8px;">Our team will review your application within 2-3 business days</li>
              <li style="margin-bottom: 8px;">We may contact you if we need additional information</li>
              <li style="margin-bottom: 8px;">You'll receive an email notification with our decision</li>
              <li style="margin-bottom: 8px;">Once approved, you'll gain access to available jobs</li>
            </ul>
          </div>
        </div>

        <!-- Important Information -->
        <div style="background-color: #fff3cd; padding: 20px; border-radius: 6px; margin-bottom: 25px; border-left: 4px solid #ffc107;">
          <h3 style="color: #856404; margin-top: 0; font-size: 18px; margin-bottom: 15px;">
            📞 Important Information
          </h3>
          <div style="color: #856404; font-size: 14px; line-height: 1.8;">
            <p style="margin: 0 0 10px 0;">Please ensure your contact details are up to date as we may need to reach you during the review process.</p>
            <p style="margin: 0;">If you have any questions about your application, please contact our support team.</p>
          </div>
        </div>

        <!-- Thank You Message -->
        <div style="text-align: center; margin-top: 25px;">
          <p style="color: #333; font-size: 16px; margin: 0;">
            Thank you for your interest in joining WindscreenCompare!
          </p>
        </div>
      </div>
    </div>
  </body>
</html>
`;

Deno.serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      },
    });
  }

  try {
    const { to, applicantName, applicationData }: EmailRequest = await req.json();

    if (!to || !applicantName || !applicationData) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: to, applicantName, applicationData' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Replace template variables
    let emailHtml = HTML_TEMPLATE
      .replace(/{{applicantName}}/g, applicantName)
      .replace(/{{email}}/g, to)
      .replace(/{{businessType}}/g, applicationData.businessType)
      .replace(/{{companyName}}/g, applicationData.companyName)
      .replace(/{{submittedAt}}/g, applicationData.submittedAt);

    // Check if we have email service configured
    const klaviyoApiKey = Deno.env.get('KLAVIYO_PRIVATE_API_KEY');
    const resendApiKey = Deno.env.get('RESEND_API_KEY');

    if (klaviyoApiKey) {
      // Send via Klaviyo
      console.log('Sending application confirmation via Klaviyo');
      
      const klaviyoResponse = await fetch('https://a.klaviyo.com/api/events/', {
        method: 'POST',
        headers: {
          'Authorization': `Klaviyo-API-Key ${klaviyoApiKey}`,
          'Content-Type': 'application/json',
          'revision': '2024-05-15'
        },
        body: JSON.stringify({
          data: {
            type: 'event',
            attributes: {
              event_type: 'application_submitted',
              profile: {
                email: to,
                first_name: applicantName.split(' ')[0],
                last_name: applicantName.split(' ').slice(1).join(' ')
              },
              properties: {
                company_name: applicationData.companyName,
                business_type: applicationData.businessType,
                application_id: applicationData.applicationId,
                submitted_at: applicationData.submittedAt
              }
            }
          }
        })
      });

      if (!klaviyoResponse.ok) {
        throw new Error(`Klaviyo API error: ${klaviyoResponse.status}`);
      }

      return new Response(
        JSON.stringify({ success: true, provider: 'klaviyo' }),
        { 
          status: 200, 
          headers: { 
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          } 
        }
      );

    } else if (resendApiKey) {
      // Send via Resend
      console.log('Sending application confirmation via Resend');
      
      const resendResponse = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${resendApiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          from: 'WindscreenCompare <noreply@windscreencompare.com>',
          to: [to],
          subject: 'Application Received - WindscreenCompare Technician',
          html: emailHtml
        })
      });

      if (!resendResponse.ok) {
        throw new Error(`Resend API error: ${resendResponse.status}`);
      }

      return new Response(
        JSON.stringify({ success: true, provider: 'resend' }),
        { 
          status: 200, 
          headers: { 
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          } 
        }
      );

    } else {
      // Demo mode - no email service configured
      console.log('Demo mode: Application confirmation email would be sent to:', to);
      
      return new Response(
        JSON.stringify({ 
          success: true, 
          demo: true, 
          message: `Application confirmation email would be sent to ${to}`,
          applicantName: applicantName,
          applicationData: applicationData
        }),
        { 
          status: 200, 
          headers: { 
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          } 
        }
      );
    }

  } catch (error) {
    console.error('Error in application confirmation email function:', error);
    
    return new Response(
      JSON.stringify({ 
        error: 'Failed to send application confirmation email',
        details: error instanceof Error ? error.message : 'Unknown error'
      }),
      { 
        status: 500,
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      }
    );
  }
});
