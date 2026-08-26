"use server";

import { NextRequest, NextResponse } from "next/server";
import providers from "@/lib/providers";
import { providerNames } from "@/lib/providers/list";
import { StreamProvider } from "@/lib/providers/types";
import clientPromise from "@/lib/db";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const anilistId = searchParams.get("id");
  const providerName = searchParams.get("provider");

  if (!anilistId) {
    return NextResponse.json(
      { message: "Missing required parameter: id" },
      { status: 400 }
    );
  }

  const client = await clientPromise;
  const db = client.db("animerealms_v2");
  const mappingsCollection = db.collection("providers_mappings");

  try {
    const mapping = await mappingsCollection.findOne({
      anilistId: Number(anilistId),
    });

    if (providerName) {
      const provider = providers.find((p) => p.name === providerName) as
        | StreamProvider
        | undefined;

      if (!provider) {
        return NextResponse.json(
          { message: `Provider '${providerName}' not found` },
          { status: 404 }
        );
      }

      if (mapping && mapping.providers && mapping.providers[provider.name]) {
        return NextResponse.json({
          [provider.name]: mapping.providers[provider.name],
        });
      } else {
        const id = await provider.map(Number(anilistId));
        if (id) {
          await mappingsCollection.updateOne(
            { anilistId: Number(anilistId) },
            { $set: { [`providers.${provider.name}`]: id } },
            { upsert: true }
          );
          return NextResponse.json({ [provider.name]: id });
        } else {
          return NextResponse.json(
            { message: "Mapping not found" },
            { status: 404 }
          );
        }
      }
    } else {
      const existingProviders =
        (mapping && Object.keys(mapping.providers)) || [];
      const providersToScrape = providerNames.filter(
        (p) => !existingProviders.includes(p)
      );

      const newMappings: Record<string, string> = {};

      for (const name of providersToScrape) {
        const provider = providers.find((p) => p.name === name) as
          | StreamProvider
          | undefined;
        if (provider) {
          const id = await provider.map(Number(anilistId));
          if (id) {
            newMappings[name] = id;
            await mappingsCollection.updateOne(
              { anilistId: Number(anilistId) },
              { $set: { [`providers.${name}`]: id } },
              { upsert: true }
            );
          }
        }
      }

      const allMappings = {
        ...(mapping && mapping.providers),
        ...newMappings,
      };

      return NextResponse.json(allMappings);
    }
  } catch (error) {
    console.error(`[API Mappings] Error:`, error);
    return NextResponse.json(
      { error: true, message: (error as Error).message },
      { status: 500 }
    );
  }
}
