
export const PublisherRESTMainExpected = {
  name: "service-d",
  summary: {
    components: 6,
    publishs: 0,
    discovers: null
  },
  components: [
    "SERVICE-A::R1",
    "SERVICE-A::R2",
    "SERVICE-A::R3",
    "SERVICE-C::R1",
    "SERVICE-C::R2",
    "SERVICE-C::R3"
  ],
  publishs: [],
  discovers: [
    "SERVICE-A::R2 --> service-a"
  ],
  endpoints: [
    {
      name: "service-a",
      host: "localhost",
      port: 3001,
      route: "/v1/publish"
    },
    {
      name: "service-c",
      host: "localhost",
      port: 3003,
      route: "/v1/publish"
    }
  ]
}
