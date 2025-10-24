// src/components/admin/EventsManagement.tsx (Corrected handleEdit)
const handleEdit = (event: Event) => {
  if (showAddForm && editingEvent?.id !== event.id) {
    if (!confirm("You have unsaved changes. Are you sure you want to discard them?")) {
      return;
    }
  }
  setFormData({
    title: event.title,
    date: event.date,
    time: event.time || "",
    location: event.location,
    description: event.description || "",
    image_url: event.image_url || "",
    is_upcoming: event.is_upcoming, // Corrected this line
  });
  setEditingEvent(event);
  setShowAddForm(true);
  setTimeout(() => {
    formCardRef.current?.scrollIntoView({ behavior: "smooth" });
  }, 100);
};

// src/components/admin/EventsManagement.tsx (Corrected handleSaveEvent)
const handleSaveEvent = async () => {
  try {
    // Correctly build eventData using formData.is_upcoming
    const eventData: Record<string, any> = {
      title: formData.title,
      date: formData.date,
      location: formData.location,
      description: formData.description || "",
      image_url: formData.image_url || "",
      is_upcoming: formData.is_upcoming, // Corrected this line
    };

    if (formData.time) eventData.time = formData.time;

    if (editingEvent) {
      await supabase
        .from("events")
        .update(eventData)
        .eq("id", editingEvent.id)
        .throwOnError();
      toast({ title: "Success", description: "Event updated." });
    } else {
      await supabase.from("events").insert(eventData).throwOnError();
      toast({ title: "Success", description: "Event added." });
    }

    fetchEvents();
    resetForm();
  } catch (error: any) {
    console.error("Error saving event:", error.message || error);
    toast({
      title: "Error",
      description: error.message || "Failed to save event.",
      variant: "destructive",
    });
  }
};
