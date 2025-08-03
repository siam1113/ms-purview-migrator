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
    console.error('🔴 Error authenticating user:', error);
    throw new Error('❌ Authentication failed');
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
      console.error('🔴 Error creating template:', result.errors);
      throw new Error('❌ Template creation failed');
    }
    console.log(`✅ Template "${input.templateName}" created successfully.`);
    return result.data.createTemplate;
  } catch (error) {
    console.error('🔴 Error creating template:', error);
    throw new Error('❌ Template creation failed');
  }
}

export async function createMatter(request: APIRequestContext, accessToken: string, input: { name: string, custodians: string[], tenantId: string, openDate: string }) {

  const response = await request.post('/', {
    headers: {
      'authorization': 'Bearer ' + accessToken,
      'content-type': 'application/json',
    },
    data: {
      query: `
        mutation CreateMatter($name: String, $custodians: [CustodiansInput], $tenantId: ID, $openDate: Date) {
          createMatter(name: $name, custodians: $custodians, tenant_id: $tenantId, open_date: $openDate)
        }
      `,
      variables: { name: input.name, custodians: input.custodians, tenantId: input.tenantId, openDate: input.openDate }
    }
  });
  const result = await response.json();
  if (result.errors) {
    console.error('🔴 Error creating matter:', result.errors);
    throw new Error('❌ Matter creation failed');
  }
  console.log(`✅ Matter "${input.name}" created successfully.`);
  return result.data.createMatter;
}

export async function createCommunication(request: APIRequestContext, accessToken: string, data: any, tenantId: string) {
  const response = await request.post('/', {
    headers: {
      'authorization': 'Bearer ' + accessToken,
      'content-type': 'application/json',
    },
    data: {
      operationName: "CreateCommunication",
      variables: {
        input: data,
        tenantId
      },
      query: `
        mutation CreateCommunication($input: CommunicationInput!, $tenantId: ID!) {
          createCommunication(input: $input, tenant_id: $tenantId) {
            _id,
            name
          }
        }
      `,

    },
  });
  const result = await response.json();
  if (result.errors) {
    console.error('🔴 Error creating communication:', result.errors);
    throw new Error('❌ Communication creation failed');
  }
  console.log(`✅ Communication "${data.name}" created successfully.`);
  return result.data.createCommunication;
}