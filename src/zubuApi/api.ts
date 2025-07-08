import { APIRequestContext } from 'playwright';

export async function authenticateUser(request: APIRequestContext, input: { email: string, password: string }) {
  try {
    const response = await request.post('/', {
      headers: {
        'content-type': 'application/json',
      },
      data: {
        query: `query AuthenticateUser($input: UserInput) {
        authenticateUser(input: $input) {
          accessToken
          refreshToken
          userId
          tenant_id
        }
      }`,
        variables: {
          input: {
            email: input.email,
            password: input.password,
          },
        },
      },
    });

    const responseBody = await response.json();
    return {
      accessToken: responseBody.data.authenticateUser.accessToken,
      refreshToken: responseBody.data.authenticateUser.refreshToken,
      userId: responseBody.data.authenticateUser.userId,
      tenant_id: responseBody.data.authenticateUser.tenant_id,
    }
  } catch (error) {
    console.error('Error authenticating user:', error);
    throw new Error('Authentication failed');
  }
}

export async function createTemplate(request: APIRequestContext, accessToken: string, input: { templateName: string, templateBody: string, tenantId: string }) {

  try {
    const response = await request.post('/', {
      headers: {
        'authorization': 'Bearer ' + accessToken,
        'content-type': 'application/json',
      },
      data: {
        operationName: "CreateTemplate",
        variables: {
          name: input.templateName,
          detail: input.templateBody,
          tenantId: input.tenantId
        },
        query: `mutation CreateTemplate($name: String, $detail: String, $tenantId: String) {
        createTemplate(name: $name, detail: $detail, tenant_id: $tenantId)
      }`
      }
    });

    const result = await response.json();
    if (result.errors) {
      console.error('Error creating template:', result.errors);
      throw new Error('Template creation failed');
    }
    console.log(`Template "${input.templateName}" created successfully.`);
    return result.data.createTemplate;
  } catch (error) {
    console.error('Error creating template:', error);
    throw new Error('Template creation failed');
  }
}
